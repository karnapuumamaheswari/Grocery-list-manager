-- Smart Grocery List Manager schema
-- Run this in Supabase SQL editor.

create extension if not exists "pgcrypto";

create table if not exists public.grocery_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null default 'other',
  quantity numeric not null default 1 check (quantity >= 0),
  price numeric not null default 0 check (price >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.pantry (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_name text not null,
  quantity numeric not null default 0 check (quantity >= 0),
  expiry_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.purchase_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  total_amount numeric not null default 0 check (total_amount >= 0),
  purchase_date timestamptz not null default now(),
  items_snapshot jsonb not null default '[]'::jsonb
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  price numeric not null default 0 check (price >= 0),
  brand text,
  store text not null
);

create index if not exists idx_grocery_items_user_created
  on public.grocery_items(user_id, created_at desc);

create index if not exists idx_pantry_user_created
  on public.pantry(user_id, created_at desc);

create unique index if not exists idx_pantry_user_item_name
  on public.pantry(user_id, lower(item_name));

create index if not exists idx_purchase_history_user_date
  on public.purchase_history(user_id, purchase_date desc);

create index if not exists idx_products_name
  on public.products(name);

-- Row level security
alter table public.grocery_items enable row level security;
alter table public.pantry enable row level security;
alter table public.purchase_history enable row level security;
alter table public.products enable row level security;

drop policy if exists "grocery_items_select_own" on public.grocery_items;
drop policy if exists "grocery_items_insert_own" on public.grocery_items;
drop policy if exists "grocery_items_update_own" on public.grocery_items;
drop policy if exists "grocery_items_delete_own" on public.grocery_items;

create policy "grocery_items_select_own"
on public.grocery_items for select
using (auth.uid() = user_id);

create policy "grocery_items_insert_own"
on public.grocery_items for insert
with check (auth.uid() = user_id);

create policy "grocery_items_update_own"
on public.grocery_items for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "grocery_items_delete_own"
on public.grocery_items for delete
using (auth.uid() = user_id);

drop policy if exists "pantry_select_own" on public.pantry;
drop policy if exists "pantry_insert_own" on public.pantry;
drop policy if exists "pantry_update_own" on public.pantry;
drop policy if exists "pantry_delete_own" on public.pantry;

create policy "pantry_select_own"
on public.pantry for select
using (auth.uid() = user_id);

create policy "pantry_insert_own"
on public.pantry for insert
with check (auth.uid() = user_id);

create policy "pantry_update_own"
on public.pantry for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "pantry_delete_own"
on public.pantry for delete
using (auth.uid() = user_id);

drop policy if exists "purchase_history_select_own" on public.purchase_history;
drop policy if exists "purchase_history_insert_own" on public.purchase_history;

create policy "purchase_history_select_own"
on public.purchase_history for select
using (auth.uid() = user_id);

create policy "purchase_history_insert_own"
on public.purchase_history for insert
with check (auth.uid() = user_id);

drop policy if exists "products_read_authenticated" on public.products;
create policy "products_read_authenticated"
on public.products for select
to authenticated
using (true);
