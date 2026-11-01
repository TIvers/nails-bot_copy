# Nails Bot

Проект интернет-магазина товаров для ногтевого сервиса. Веб-приложение запускается как Telegram WebApp, а серверная часть получает данные каталога из Bitrix24 через REST API и предоставляет их приложению через PHP API и PostgreSQL.

В репозитории также есть отдельный сервис импорта выгрузок Excel/HTML: он асинхронно обновляет изображения и активность разделов каталога в PostgreSQL.

## Как устроен проект

```text
Telegram WebApp (React)
        │ HTTP / JSON
        ▼
PHP API ───── Bitrix24 REST API
   │
   └──────── PostgreSQL

Выгрузка Excel/HTML
        │ POST /upload
        ▼
FastAPI ── Redis ── Celery worker ── PostgreSQL
```

- **`nails-bot_main/`** — интерфейс магазина на React и Vite. В приложении есть каталог и поиск товаров, корзина, оформление заказа, история заказов и административный просмотр заказов. При запуске внутри Telegram используется Telegram WebApp SDK.
- **`nails-bot_backend/api/`** — PHP API для каталога, пользователей, заказов, оплаты и доставки; здесь же находится подключение к PostgreSQL.
- **`nails-bot_backend/api_bitrix/`** — PHP-клиент Bitrix24 REST API для работы с товарами и разделами каталога.
- **`nails-bot_backend/api/endpoints_for_nails_bot/`** — FastAPI-сервис загрузки файлов и Celery-задача для фоновой обработки выгрузок. Задача обновляет в `public.sections` поля `detail_picture`, `picture` и `active` по `id_section`; вставку новых разделов она не выполняет.

## Технологии

- Frontend: React 18, Vite, React Router, Redux Toolkit, Tailwind CSS.
- API магазина: PHP, PDO, PostgreSQL; интеграция с Bitrix24 REST API.
- Импорт выгрузок: Python 3.10, FastAPI, Celery, Redis, Pandas, SQLAlchemy.
- Локальный запуск импорт-сервиса и фонового обработчика описан в `docker-compose.yml`.

## Запуск frontend

Требуется Node.js и npm.

```powershell
cd .\nails-bot_main
npm ci
npm run dev
```

Для production-сборки и локального просмотра:

```powershell
npm run build
npm run preview
```

Проверка линтером:

```powershell
npm run lint
```

Frontend обращается к PHP API по адресу, заданному в `nails-bot_main/src/api.js` (`baseURL`). Перед локальным запуском или развертыванием проверьте, что там указан адрес доступного API и что сервер разрешает запросы с origin приложения.

Ключ Яндекс.Карт задается через `VITE_YANDEX_MAPS_API_KEY` в локальном `nails-bot_main/.env`. Это клиентский ключ: после сборки он доступен браузеру, поэтому ограничьте его разрешенными доменами в настройках Яндекса.

## Запуск сервиса импорта

Для контейнерного запуска требуются Docker и Docker Compose. Compose-файл находится в `nails-bot_backend/api/endpoints_for_nails_bot/`.

Перед запуском:

1. Создайте локальный `.env` на основе `.env.example` и настройте `DATABASE_URL`, `UPLOAD_TOKEN` (не менее 32 символов), `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND` и пути bind mounts.
2. Задайте переменные `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` и `BITRIX_REST_URL`; PHP API также использует `BOXBERRY_API_TOKEN`, `TINKOFF_TERMINAL_KEY` и `TINKOFF_PASSWORD`.
3. Проверьте конфигурацию подключения к базе, доступы интеграций и права на каталоги. Не публикуйте локальные `.env` и не помещайте секреты в Docker Compose.
4. Убедитесь, что целевая база доступна и содержит таблицу `public.sections` с колонками, которые обновляет задача.

Затем из каталога сервиса:

```powershell
cd .\nails-bot_backend\api\endpoints_for_nails_bot
docker compose up --build
```

В текущей конфигурации API внутри контейнера слушает порт `8000`, который опубликован как порт `8080` хоста.

### Импорт файла

- `GET /health` — проверка доступности API.
- `POST /upload` — загрузка `.xls`, `.xlsx` или `.xlsm`; передайте файл как multipart-поле `file` и значение `UPLOAD_TOKEN` в HTTP-заголовке `token`.
- `GET /task/{task_id}` — получение статуса фоновой задачи по `task_id` из ответа загрузки.

Выгрузка должна содержать колонки `Детальная картинка`, `Изображение`, `Активность` и `ID раздела`. Задача может обрабатывать Excel и HTML-таблицы; невалидные ID разделов пропускаются.

## Документация API

- [Описание API каталога](./nails-bot_main/api_documentation%20(5).md)
- [Описание проверки активности товара](./nails-bot_main/check_item_API.md)
- Реализации PHP-эндпоинтов находятся в `nails-bot_backend/api/`.

## Безопасность и развертывание

- Секреты БД и интеграций читаются из переменных окружения. Примеры конфигурации не содержат учетных данных; реальные значения задавайте только локально или в защищенном хранилище секретов.
- Если секреты из прежней конфигурации уже попадали в Git или публиковались, считайте их скомпрометированными и замените в PostgreSQL, Bitrix24, платежной системе, Boxberry и Яндекс.Картах. Удаление из текущей версии не очищает историю Git.
- Замените адрес API во frontend на адрес своего развертывания и используйте HTTPS для внешнего доступа.
- Не запускайте сервис импорта в публичной сети без настройки сильного `UPLOAD_TOKEN` и соответствующего ограничения доступа.
