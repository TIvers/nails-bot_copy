import os
import uuid
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, Header, HTTPException
from celery import Celery

from app.settings import settings
# Импортируем tasks, чтобы Celery знал их
import app.tasks  # noqa: F401

# Папка для входящих файлов
INBOX = Path(settings.inbox_dir if hasattr(settings, 'inbox_dir') else "/var/lib/ingest/inbox")
INBOX.mkdir(parents=True, exist_ok=True)

# Создаем Celery подключение с бэкендом для результатов
celery = Celery(
    "shtu_bot_b",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["app.tasks"],
)

app = FastAPI(
    title="Excel ingest API",
    description="API для загрузки и обработки Excel/HTML файлов",
    version="1.0.0"
)


@app.get("/")
async def root():
    return {"message": "Excel ingest API is running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "inbox_path": str(INBOX)}


@app.post("/upload", status_code=201)
async def upload_xlsx(
    file: UploadFile = File(...),
    token: str = Header(...)
):
    print(f"File: {file.filename}")

    if token != settings.upload_token:
        raise HTTPException(status_code=401, detail="Invalid token")

    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    if not file.filename.lower().endswith((".xls", ".xlsx", ".xlsm")):
        raise HTTPException(status_code=415, detail="Excel files only (.xls, .xlsx, .xlsm)")

    # Генерируем уникальное имя
    saved_name = f"{uuid.uuid4()}{Path(file.filename).suffix}"
    dest = INBOX / saved_name

    try:
        # Сохраняем в бинарном режиме
        content = await file.read()
        dest.write_bytes(content)

        # Планируем задачу
        task = celery.send_task(
            "app.tasks.parse_and_store",
            args=[str(dest)],
            kwargs={},
            queue="celery",
        )

        return {
            "status": "accepted",
            "file": saved_name,
            "task_id": task.id
        }

    except Exception as e:
        if dest.exists():
            dest.unlink()
        raise HTTPException(status_code=500, detail=f"Failed to process file: {e}")


@app.get("/task/{task_id}")
async def get_task_status(task_id: str):
    res = celery.AsyncResult(task_id)
    return {
        "task_id": task_id,
        "status": res.status,
        "result": res.result if res.ready() else None
    }
