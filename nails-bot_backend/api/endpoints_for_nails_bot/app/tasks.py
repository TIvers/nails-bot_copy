# app/tasks.py
"""
Celery task: парсит Excel/HTML и ОБНОВЛЯЕТ картинки и флаг активности
в таблице public.sections. Никаких INSERT — только UPDATE по id_section.
Поле `name` не трогаем и не требуем.
ВАЖНО: active теперь записывается как 'Y' или 'N' вместо boolean.
"""
from __future__ import annotations

import logging, os, shutil
import math
import re
from pathlib import Path
from typing import Dict, Iterable, List, Optional
import subprocess

import pandas as pd
from celery import Celery
from sqlalchemy import create_engine, text

from app.settings import settings  # Pydantic-модель с DSN/URL/токенами

# --------------------------------------------------------------------------- #
# Логирование
# --------------------------------------------------------------------------- #
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# --------------------------------------------------------------------------- #
# Celery-приложение
# --------------------------------------------------------------------------- #
celery_app = Celery(
    "shtu_bot_b",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["app.tasks"],
)
celery_app.conf.update(task_serializer="json", accept_content=["json"])

# --------------------------------------------------------------------------- #
# SQLAlchemy Engine
# --------------------------------------------------------------------------- #
engine = create_engine(
    settings.database_url,
    future=True,
    pool_pre_ping=True,
    connect_args={"connect_timeout": 5},
)

# --------------------------------------------------------------------------- #
# Вспомогательные функции
# --------------------------------------------------------------------------- #
DOMAIN_PREFIX_RE = re.compile(r"^https?://(?:www\.)?shtuchki\.pro/", re.I)
ENABLE_PHP_PREUPDATE = os.getenv("ENABLE_PHP_PREUPDATE", "0").lower() in ("1","true","yes")
PHP_SCRIPT = os.getenv("PHP_SCRIPT", "/app/backend/api/db_update.php")



def strip_domain(url: str | None) -> str | None:
    """Убираем домен shtuchki.pro и ведущие слэши. Пустое -> None."""
    if url is None:
        return None
    if isinstance(url, float) and math.isnan(url):
        return None
    s = str(url).strip()
    if not s or s.lower() == "nan":
        return None
    s = DOMAIN_PREFIX_RE.sub("", s).lstrip("/")
    return s or None


def parse_active(val) -> Optional[str]:
    """
    Нормализует активность из Excel/HTML в формат Y/N:
    Да/Нет, Y/N, True/False, 1/0, Вкл/Выкл и т.п. -> 'Y' или 'N'
    Пустое/непонятное -> None (не обновлять).
    """
    if val is None:
        return None
    if isinstance(val, float) and math.isnan(val):
        return None

    s = str(val).strip().lower()
    if not s or s in {"nan", "-"}:
        return None

    # Положительные значения -> 'Y'
    truthy = {"да", "y", "yes", "true", "1", "вкл", "on", "активен", "active"}
    # Отрицательные значения -> 'N'
    falsy = {"нет", "n", "no", "false", "0", "выкл", "off", "не активен", "inactive"}

    if s in truthy:
        return "Y"
    if s in falsy:
        return "N"

    # Иногда приходят "Да " или "Нет " с мусором — оставим попытку по первой букве
    if s.startswith(("да", "ye", "tr", "1", "vk", "on", "ac")):
        return "Y"
    if s.startswith(("не", "no", "fa", "0", "vy", "of", "in")):
        return "N"

    return None


def chunked(it: Iterable[dict], size: int) -> Iterable[List[dict]]:
    """Разбивает итератор на пачки по size — для батчевых апдейтов."""
    buf: List[dict] = []
    for x in it:
        buf.append(x)
        if len(buf) >= size:
            yield buf
            buf = []
    if buf:
        yield buf


# Обновляем ТОЛЬКО переданные поля. Если поле не пришло (None) — не трогаем.
# Избегаем лишних апдейтов через IS DISTINCT FROM.
# ВАЖНО: active теперь сравнивается как строка 'Y'/'N'
UPDATE_SQL = text(
    """
    UPDATE public.sections AS s
       SET detail_picture = CASE
                               WHEN :detail_picture_provided THEN :detail_picture
                               ELSE s.detail_picture
                            END,
           picture        = CASE
                               WHEN :picture_provided THEN :picture
                               ELSE s.picture
                            END,
           active         = CASE
                               WHEN :active_provided THEN :active
                               ELSE s.active
                            END
     WHERE s.id_section   = :id_section
       AND (
             (:detail_picture_provided AND s.detail_picture IS DISTINCT FROM :detail_picture)
          OR (:picture_provided        AND s.picture        IS DISTINCT FROM :picture)
          OR (:active_provided         AND s.active         IS DISTINCT FROM :active)
       )
    """
)

# --------------------------------------------------------------------------- #
# Основная задача: parse_and_store, run_php_db_update
# --------------------------------------------------------------------------- #
def run_php_db_update():
    if not ENABLE_PHP_PREUPDATE:
        logger.info("PHP pre-update disabled; skipping.")
        return

    if shutil.which("php") is None:
        raise FileNotFoundError("php-cli not found in container")

    if not os.path.isfile(PHP_SCRIPT):
        raise FileNotFoundError(f"PHP script not found: {PHP_SCRIPT}")

    logger.info("Запуск PHP pre-update: %s", PHP_SCRIPT)
    subprocess.run(["php", PHP_SCRIPT], check=True)

@celery_app.task
def parse_and_store(xls_path: str) -> str:
    path = Path(xls_path)
    logger.info("Starting parse_and_store for file: %s", path)

    # 0) PHP pre-update — перед парсингом и апдейтами
    try:
        run_php_db_update()
    except Exception as e:
        # Останавливаем задачу: бизнес-логика говорит «сначала sync в PHP, потом парсинг»
        logger.error("PHP pre-update failed: %s", e)
        raise

    if not path.is_file():
        msg = f"File not found: {path}"
        logger.error(msg)
        return msg

    raw = path.read_bytes()
    snippet = raw.lstrip()[:15].lower()

    # --- Парсинг входного файла (HTML или Excel) ---
    if snippet.startswith(b"<html") or b"<table" in snippet:
        logger.info("Detected HTML export, parsing via read_html")
        try:
            tables = pd.read_html(path, header=0)
            if not tables:
                raise ValueError("No tables found in HTML file")
            df = tables[0]
        except Exception as exc:
            msg = f"Error parsing HTML: {exc}"
            logger.exception(msg)
            return msg
    else:
        ext = path.suffix.lower()
        if ext == ".xls":
            engine_read = "xlrd"
        elif ext in (".xlsx", ".xlsm"):
            engine_read = "openpyxl"
        else:
            msg = f"Unsupported extension: {ext}"
            logger.error(msg)
            return msg

        logger.info("Reading Excel file: %s (engine=%s)", path, engine_read)
        try:
            df = pd.read_excel(path, dtype=str, engine=engine_read)
        except Exception as exc:
            msg = f"Error reading Excel: {exc}"
            logger.exception(msg)
            return msg

    # --- Подготовка данных ---
    mapping: Dict[str, str] = {
        "Детальная картинка": "detail_picture",
        "Изображение": "picture",
        "Активность": "active",
        "ID раздела": "id_section",
    }
    missing = [col for col in mapping if col not in df.columns]
    if missing:
        msg = f"Missing columns: {missing}"
        logger.error(msg)
        return msg

    df = df[list(mapping.keys())].rename(columns=mapping)
    df["id_section"] = pd.to_numeric(df["id_section"], errors="coerce").astype("Int64")

    # нормализация путей
    for col in ("detail_picture", "picture"):
        if col in df.columns:
            df[col] = df[col].apply(strip_domain)

    # нормализация активности: теперь возвращает 'Y', 'N' или None
    df["active"] = df["active"].apply(parse_active)

    # фильтр исходных строк
    records: List[dict] = []
    for rec in df.to_dict(orient="records"):
        id_section = rec.get("id_section")
        if pd.isna(id_section):
            continue  # пропускаем строки без id

        dp = strip_domain(rec.get("detail_picture"))
        pic = strip_domain(rec.get("picture"))
        act = rec.get("active")  # уже None/'Y'/'N' после parse_active

        # если не пришло ни одной картинки и активность тоже не распознана — апдейт не нужен
        if dp is None and pic is None and act is None:
            continue

        records.append(
            {
                "id_section": int(id_section),
                "detail_picture": dp,
                "picture": pic,
                "active": act,  # 'Y', 'N' или None
                "detail_picture_provided": dp is not None,
                "picture_provided": pic is not None,
                "active_provided": act is not None,
            }
        )

    total_src = len(df)
    total_payload = len(records)
    success = 0
    failed = 0

    if not records:
        result = (
            f"No applicable rows (nothing to change) in {path.name}. "
            f"Source rows: {total_src}, to-update: 0"
        )
        logger.info(result)
        return result

    # --- Массовые апдейты пачками ---
    try:
        with engine.begin() as conn:
            for batch in chunked(records, size=500):
                res = conn.execute(UPDATE_SQL, batch)
                success += res.rowcount if res.rowcount is not None else 0
    except Exception as exc:
        logger.exception("Batch update failed: %s", exc)
        failed = total_payload

    result = (
        f"Sections update finished for {path.name}: "
        f"updated={success}, attempted={total_payload}, source_rows={total_src}"
    )
    logger.info(result)
    return result