# Brightloop Subscription Management

One system for products, plans, quotations, subscriptions, recurring invoices, recorded payments, discounts, and finance reporting.

## Run locally

The app uses SQLite by default (`prisma/dev.db`) so it runs without Docker. `docker-compose.yml` is included if you prefer PostgreSQL later.

```bash
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Open http://localhost:3000

| Role     | Email                     | Password     |
| -------- | ------------------------- | ------------ |
| Admin    | admin@brightloop.test     | Admin123!    |
| Staff    | staff@brightloop.test     | Staff123!    |
| Customer | customer@acme.test        | Customer123! |

Run due invoices on demand from the dashboard, with `npm run billing`, or:

```bash
curl -X POST http://localhost:3000/api/cron/billing -H "Authorization: Bearer $CRON_SECRET"
```

`npm run billing:worker` runs the hourly scheduler.
