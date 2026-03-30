# AvtoSlot

Полный MVP русскоязычного сервиса онлайн-записи в автосервис на PostgreSQL.

Проект включает:

- публичный сайт с главной страницей, услугами, страницами "О сервисе" и "Контакты";
- пошаговую форму онлайн-бронирования;
- личный кабинет клиента с профилем, автомобилями, историей заявок и уведомлениями;
- панель администратора с управлением услугами, статусами, переносом записей и базой клиентов;
- панель мастера с назначенными работами и сменой статусов;
- REST API по ТЗ;
- защиту от конфликтующих слотов при бронировании.

## Стек

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS 4
- Prisma ORM
- PostgreSQL 16
- JWT-сессии через `jose`
- Docker Compose для локальной БД и VPS-развертывания

## Название проекта

Выбрано название **AvtoSlot**: коротко, понятно и сразу связано с записью в автосервис.

## Демо-аккаунты

- Администратор: `admin@avtoslot.ru` / `Demo12345!`
- Клиент: `client@avtoslot.ru` / `Demo12345!`
- Мастер: `master1@avtoslot.ru` / `Demo12345!`

## Локальный запуск

1. Установите зависимости:

```bash
npm install
```

2. Поднимите PostgreSQL в Docker:

```bash
docker compose up -d postgres
```

3. Проверьте `.env`.

По умолчанию проект использует локальный Postgres на `5433`, потому что `5432` у вас уже был занят:

```env
DATABASE_URL="postgresql://avtoslot:avtoslot_password@localhost:5433/avtoslot?schema=public"
JWT_SECRET="local-avtoslot-secret-change-me"
NEXT_PUBLIC_APP_NAME="AvtoSlot"
```

4. Примените миграции:

```bash
npm run db:deploy
```

Если база создается впервые и вы работаете локально, можно также использовать:

```bash
npm run db:migrate -- --name init
```

5. Заполните БД тестовыми данными:

```bash
npm run db:seed
```

6. Запустите приложение:

```bash
npm run dev
```

7. Откройте:

```text
http://localhost:3000
```

## Команды базы

```bash
npm run db:push
npm run db:migrate -- --name init
npm run db:deploy
npm run db:seed
npm run db:studio
```

## Проверка

```bash
npm run lint
npm run build
```

Обе команды проходят успешно.

## Основные сценарии MVP

### Клиент

- регистрация и вход;
- добавление нескольких автомобилей;
- выбор одной или нескольких услуг;
- расчет свободных слотов;
- создание записи;
- отмена записи;
- просмотр истории и уведомлений.

### Администратор

- просмотр всех заявок;
- фильтрация и контроль статусов;
- перенос записи на другую дату и время;
- управление услугами и ценами;
- просмотр клиентов;
- просмотр загрузки мастеров и рабочих часов.

### Мастер

- просмотр назначенных заявок;
- перевод заявки в статусы `Подтверждена`, `В работе`, `Завершена`;
- комментарии по выполненным работам.

## Структура

```text
src/app             страницы и API routes
src/components      клиентские интерфейсные компоненты
src/lib             Prisma, auth, validators, booking logic
prisma/schema.prisma
prisma/migrations
prisma/seed.ts
docker-compose.yml
```

## Деплой на GitHub и VPS

Базовый сценарий:

1. Залейте проект в GitHub.
2. На VPS установите Docker, Docker Compose, Node.js 20+ и npm.
3. Склонируйте репозиторий.
4. Создайте `.env` под сервер:

```env
DATABASE_URL="postgresql://avtoslot:strong_password@127.0.0.1:5432/avtoslot?schema=public"
JWT_SECRET="replace-with-strong-secret"
NEXT_PUBLIC_APP_NAME="AvtoSlot"
```

5. Поднимите PostgreSQL на сервере.

Если хотите использовать тот же compose-файл, можно поменять порт обратно на `5432` или оставить `5433`, если это удобнее.

6. Выполните:

```bash
npm install
npx prisma generate
npm run db:deploy
npm run db:seed
npm run build
npm run start
```

Для постоянного процесса лучше запускать через `pm2`, `systemd`, Docker Compose или reverse proxy с Nginx.

## Что можно добавить дальше

- онлайн-оплату;
- SMS и email-уведомления;
- CRM-интеграцию;
- полноценное управление графиком мастеров;
- календарный вид расписания;
- отзывы после визита;
- загрузку фотографий автомобиля и акта работ;
- multi-branch поддержку нескольких филиалов автосервиса.
