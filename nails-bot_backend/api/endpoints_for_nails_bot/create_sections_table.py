import os
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, Boolean, text

# 1) Берём DSN из окружения, FALLBACK — на сервис 'db' из docker-compose
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://bot:botpass@db:5432/mydb"
)

# 2) Движок и метаданные
engine = create_engine(DATABASE_URL, echo=False, future=True)
metadata = MetaData()

# 3) Таблица
sections = Table(
    "sections",
    metadata,
    Column("id_section", Integer, primary_key=True),
    Column("detail_picture", String, nullable=True),
    Column("picture", String, nullable=True),
    Column("active", Boolean, nullable=False, server_default=text("false")),
)

# 4) Создание схемы
def main() -> None:
    metadata.create_all(engine)
    print("Таблица 'sections' создана (если отсутствовала).")

if __name__ == "__main__":
    main()
