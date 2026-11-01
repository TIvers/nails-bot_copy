import pandas as pd
from typing import List, Dict

# Обязательные колонки для обработки секций
MANDATORY_SECTIONS = {"Детальная картинка", "Изображение", "Активность", "ID раздела"}


def df_from_excel_sections(path: str) -> pd.DataFrame:
    """
    Парсит Excel файл для обработки секций

    Args:
        path: путь к Excel файлу

    Returns:
        DataFrame с обработанными данными для секций

    Raises:
        ValueError: если отсутствуют обязательные колонки
    """
    # Читаем Excel файл
    df = pd.read_excel(path, dtype=str)

    # Проверяем наличие обязательных колонок
    missing = MANDATORY_SECTIONS - set(df.columns)
    if missing:
        raise ValueError(f"Missing columns: {missing}")

    # Выбираем только нужные колонки
    df = df[list(MANDATORY_SECTIONS)]

    # Маппинг колонок для БД
    column_mapping = {
        "Детальная картинка": "detail_picture",
        "Изображение": "picture",
        "Активность": "active",
        "ID раздела": "id_section",
    }

    df = df.rename(columns=column_mapping)

    # Обрабатываем типы данных
    df["id_section"] = pd.to_numeric(df["id_section"], errors='coerce').astype('Int64')
    df["active"] = df["active"].str.upper().fillna("N")

    # Удаляем строки с некорректным id_section
    df = df.dropna(subset=['id_section'])

    return df


def validate_sections_data(df: pd.DataFrame) -> List[Dict]:
    """
    Валидирует данные секций

    Args:
        df: DataFrame с данными

    Returns:
        Список словарей с валидными данными
    """
    valid_rows = []

    for _, row in df.iterrows():
        # Проверяем, что id_section является числом
        if pd.isna(row["id_section"]):
            continue

        valid_rows.append({
            "id_section": int(row["id_section"]),
            "detail_picture": row["detail_picture"] if pd.notna(row["detail_picture"]) else None,
            "picture": row["picture"] if pd.notna(row["picture"]) else None,
        })

    return valid_rows