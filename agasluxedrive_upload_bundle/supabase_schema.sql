create extension if not exists pgcrypto;

create table if not exists car_uploads (
  id uuid primary key default gen_random_uuid(),
  car_id text,
  seller_name text,
  seller_email text,
  seller_phone text,
  make text,
  model text,
  year int,
  spec text,
  files jsonb not null,
  created_at timestamptz default now()
);

alter table car_uploads enable row level security;
