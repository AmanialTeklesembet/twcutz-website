# TW'Cutz Website

Premium barber portfolio and booking site for TW'Cutz / `@twcutz1`.

## Run locally

```powershell
npm start
```

Open `http://localhost:3000`.

Default owner login:

- Email: `admin@twcutz.no`
- Password: `ChangeMe123!`

For a real deployment, set these environment variables before starting:

```powershell
$env:ADMIN_EMAIL="owner@example.com"
$env:ADMIN_PASSWORD="a-strong-password"
$env:SESSION_SECRET="a-long-random-secret"
npm start
```

## What is included

- Responsive dark premium frontend
- Norwegian and English language switcher
- Instagram-style profile section
- Gallery, services, booking and contact form
- Admin login
- Admin editing for services, gallery, booking statuses, contact messages and bilingual text
- Local persistent data in `data/db.json`
- PostgreSQL/Supabase migration schema in `database/schema.sql`

## Production notes

The current backend is dependency-free and stores data in a local JSON file for easy local use. Before public launch, move the schema in `database/schema.sql` to Supabase/PostgreSQL, add HTTPS, replace the demo admin password, and connect email/SMS notifications from the booking endpoint.
