-- PostgreSQL/Supabase-ready schema for a later production migration.
-- The local prototype uses data/db.json through server.js so it can run without dependencies.

create table services (
  id uuid primary key default gen_random_uuid(),
  name_no text not null,
  name_en text not null,
  description_no text not null,
  description_en text not null,
  price integer not null,
  duration integer not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  email text,
  service_id uuid references services(id),
  date date not null,
  time time not null,
  status text not null check (status in ('ny', 'bekreftet', 'fullført', 'kansellert')) default 'ny',
  comment text,
  created_at timestamptz not null default now()
);

create table gallery (
  id uuid primary key default gen_random_uuid(),
  image text not null,
  title text not null,
  category text not null,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact text not null,
  message text not null,
  status text not null check (status in ('ny', 'lest', 'besvart')) default 'ny',
  created_at timestamptz not null default now()
);

create table admin_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  role text not null default 'owner',
  created_at timestamptz not null default now()
);
