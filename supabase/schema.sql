create extension if not exists pgcrypto;

create sequence if not exists public.invoice_number_seq;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null default '',
  full_name text not null,
  phone text not null default '',
  role text not null default 'pelanggan'
    check (role in ('pemilik', 'kasir', 'pelanggan')),
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists email text not null default '';

create table if not exists public.products (
  id text primary key,
  name text not null,
  category text not null default 'Classic',
  cost_price numeric(12, 2) not null default 0 check (cost_price >= 0),
  price numeric(12, 2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  min_stock integer not null default 0 check (min_stock >= 0),
  unit text not null default 'pcs',
  description text not null default '',
  image text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  invoice_no text not null unique,
  customer_id uuid references public.profiles (id) on delete set null,
  cashier_id uuid references public.profiles (id) on delete set null,
  customer_name text not null,
  customer_phone text not null default '',
  cashier_name text not null default '',
  total_items integer not null default 0 check (total_items >= 0),
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  discount numeric(12, 2) not null default 0 check (discount >= 0),
  grand_total numeric(12, 2) not null check (grand_total >= 0),
  total_cost numeric(12, 2) not null default 0 check (total_cost >= 0),
  net_profit numeric(12, 2) not null default 0,
  payment_method text not null default 'cash_on_pickup'
    check (payment_method in ('cash', 'qris', 'transfer', 'cash_on_pickup', 'later')),
  cash_paid numeric(12, 2) not null default 0 check (cash_paid >= 0),
  cash_change numeric(12, 2) not null default 0 check (cash_change >= 0),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'refunded')),
  status text not null default 'processing'
    check (status in ('processing', 'completed', 'cancelled')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transaction_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions (id) on delete cascade,
  product_id text references public.products (id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit text not null default 'pcs',
  price numeric(12, 2) not null check (price >= 0),
  cost_price numeric(12, 2) not null default 0 check (cost_price >= 0),
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  created_at timestamptz not null default now()
);

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select role from public.profiles where id = (select auth.uid())
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(public.current_user_role() in ('pemilik', 'kasir'), false)
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(public.current_user_role() = 'pemilik', false)
$$;

drop function if exists public.create_customer_order(jsonb, text);

create or replace function public.create_customer_order(
  p_items jsonb,
  p_notes text default '',
  p_payment_method text default 'cash_on_pickup'
)
returns table (transaction_id uuid, invoice_no text, grand_total numeric)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_customer_id uuid := auth.uid();
  v_customer_name text;
  v_customer_phone text;
  v_item record;
  v_product public.products%rowtype;
  v_transaction_id uuid := gen_random_uuid();
  v_invoice_no text;
  v_subtotal numeric(12, 2) := 0;
  v_total_cost numeric(12, 2) := 0;
  v_total_items integer := 0;
begin
  if v_customer_id is null or public.current_user_role() <> 'pelanggan' then
    raise exception 'Hanya akun pelanggan yang dapat membuat pesanan.';
  end if;

  if p_items is null
     or jsonb_typeof(p_items) is distinct from 'array'
     or jsonb_array_length(p_items) = 0 then
    raise exception 'Keranjang pesanan kosong.';
  end if;

  if p_payment_method not in ('cash_on_pickup', 'qris') then
    raise exception 'Metode pembayaran pesanan pelanggan tidak valid.';
  end if;

  select full_name, phone
    into v_customer_name, v_customer_phone
    from public.profiles
    where id = v_customer_id;

  if v_customer_name is null then
    raise exception 'Profil pelanggan belum tersedia.';
  end if;

  for v_item in
    select entry.item ->> 'productId' as product_id,
           sum((entry.item ->> 'quantity')::integer)::integer as quantity
      from jsonb_array_elements(p_items) as entry(item)
     group by entry.item ->> 'productId'
     order by entry.item ->> 'productId'
  loop
    if v_item.product_id is null or v_item.quantity is null or v_item.quantity <= 0 then
      raise exception 'Data produk atau jumlah pesanan tidak valid.';
    end if;

    select *
      into v_product
      from public.products
     where id = v_item.product_id and is_active = true
     for update;

    if not found then
      raise exception 'Produk % tidak tersedia.', v_item.product_id;
    end if;

    if v_product.stock < v_item.quantity then
      raise exception 'Stok % tidak mencukupi.', v_product.name;
    end if;

    v_subtotal := v_subtotal + (v_product.price * v_item.quantity);
    v_total_cost := v_total_cost + (v_product.cost_price * v_item.quantity);
    v_total_items := v_total_items + v_item.quantity;

    update public.products
       set stock = stock - v_item.quantity,
           updated_at = now()
     where id = v_product.id;
  end loop;

  v_invoice_no := 'INV/DBD/' ||
    to_char(now() at time zone 'Asia/Jakarta', 'YYYYMMDD') || '/' ||
    lpad(nextval('public.invoice_number_seq')::text, 6, '0');

  insert into public.transactions (
    id, invoice_no, customer_id, customer_name, customer_phone,
    total_items, subtotal, grand_total, total_cost, net_profit,
    payment_method, payment_status, status, notes
  ) values (
    v_transaction_id, v_invoice_no, v_customer_id, v_customer_name, coalesce(v_customer_phone, ''),
    v_total_items, v_subtotal, v_subtotal, v_total_cost, v_subtotal - v_total_cost,
    p_payment_method, 'pending', 'processing', coalesce(p_notes, '')
  );

  insert into public.transaction_items (
    transaction_id, product_id, product_name, quantity, unit, price, cost_price, subtotal
  )
  select v_transaction_id,
         product.id,
         product.name,
         grouped.quantity,
         product.unit,
         product.price,
         product.cost_price,
         product.price * grouped.quantity
    from (
      select entry.item ->> 'productId' as product_id,
             sum((entry.item ->> 'quantity')::integer)::integer as quantity
        from jsonb_array_elements(p_items) as entry(item)
       group by entry.item ->> 'productId'
    ) as grouped
    join public.products as product on product.id = grouped.product_id;

  return query select v_transaction_id, v_invoice_no, v_subtotal;
end;
$$;

create or replace function public.create_pos_transaction(
  p_items jsonb,
  p_discount numeric default 0,
  p_payment_method text default 'cash',
  p_payment_status text default 'paid',
  p_cash_paid numeric default 0,
  p_notes text default '',
  p_customer_name text default 'Pelanggan Walk-in',
  p_customer_phone text default ''
)
returns table (transaction_id uuid, invoice_no text, grand_total numeric)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_cashier_id uuid := auth.uid();
  v_cashier_name text;
  v_item record;
  v_product public.products%rowtype;
  v_transaction_id uuid := gen_random_uuid();
  v_invoice_no text;
  v_subtotal numeric(12, 2) := 0;
  v_total_cost numeric(12, 2) := 0;
  v_discount numeric(12, 2) := coalesce(p_discount, 0);
  v_grand_total numeric(12, 2);
  v_total_items integer := 0;
  v_cash_paid numeric(12, 2) := coalesce(p_cash_paid, 0);
begin
  if v_cashier_id is null or not public.is_staff() then
    raise exception 'Hanya pemilik atau kasir yang dapat mencatat transaksi POS.';
  end if;

  if p_payment_method not in ('cash', 'qris') then
    raise exception 'Metode pembayaran POS tidak valid.';
  end if;

  if p_payment_status not in ('pending', 'paid') then
    raise exception 'Status pembayaran tidak valid.';
  end if;

  if p_payment_method = 'cash' and p_payment_status <> 'paid' then
    raise exception 'Transaksi tunai harus dibayar saat disimpan.';
  end if;

  if p_items is null
     or jsonb_typeof(p_items) is distinct from 'array'
     or jsonb_array_length(p_items) = 0 then
    raise exception 'Keranjang transaksi kosong.';
  end if;

  select full_name
    into v_cashier_name
    from public.profiles
   where id = v_cashier_id;

  if v_cashier_name is null then
    raise exception 'Profil kasir belum tersedia.';
  end if;

  for v_item in
    select entry.item ->> 'productId' as product_id,
           sum((entry.item ->> 'quantity')::integer)::integer as quantity
      from jsonb_array_elements(p_items) as entry(item)
     group by entry.item ->> 'productId'
     order by entry.item ->> 'productId'
  loop
    if v_item.product_id is null or v_item.quantity is null or v_item.quantity <= 0 then
      raise exception 'Data produk atau jumlah transaksi tidak valid.';
    end if;

    select *
      into v_product
      from public.products
     where id = v_item.product_id and is_active = true
     for update;

    if not found then
      raise exception 'Produk % tidak tersedia.', v_item.product_id;
    end if;

    if v_product.stock < v_item.quantity then
      raise exception 'Stok % tidak mencukupi.', v_product.name;
    end if;

    v_subtotal := v_subtotal + (v_product.price * v_item.quantity);
    v_total_cost := v_total_cost + (v_product.cost_price * v_item.quantity);
    v_total_items := v_total_items + v_item.quantity;

    update public.products
       set stock = stock - v_item.quantity,
           updated_at = now()
     where id = v_product.id;
  end loop;

  if v_discount < 0 or v_discount > v_subtotal then
    raise exception 'Potongan transaksi tidak valid.';
  end if;

  v_grand_total := v_subtotal - v_discount;

  if p_payment_method = 'cash' and v_cash_paid < v_grand_total then
    raise exception 'Uang tunai yang diterima kurang dari total tagihan.';
  end if;

  v_invoice_no := 'INV/DBD/' ||
    to_char(now() at time zone 'Asia/Jakarta', 'YYYYMMDD') || '/' ||
    lpad(nextval('public.invoice_number_seq')::text, 6, '0');

  insert into public.transactions (
    id, invoice_no, cashier_id, customer_name, customer_phone, cashier_name,
    total_items, subtotal, discount, grand_total, total_cost, net_profit,
    payment_method, cash_paid, cash_change, payment_status, status, notes
  ) values (
    v_transaction_id, v_invoice_no, v_cashier_id,
    coalesce(nullif(trim(p_customer_name), ''), 'Pelanggan Walk-in'),
    coalesce(nullif(trim(p_customer_phone), ''), ''),
    v_cashier_name, v_total_items, v_subtotal, v_discount, v_grand_total,
    v_total_cost, v_grand_total - v_total_cost, p_payment_method,
    case when p_payment_method = 'cash' then v_cash_paid else v_grand_total end,
    case when p_payment_method = 'cash' then v_cash_paid - v_grand_total else 0 end,
    p_payment_status, 'completed', coalesce(p_notes, '')
  );

  insert into public.transaction_items (
    transaction_id, product_id, product_name, quantity, unit, price, cost_price, subtotal
  )
  select v_transaction_id,
         product.id,
         product.name,
         grouped.quantity,
         product.unit,
         product.price,
         product.cost_price,
         product.price * grouped.quantity
    from (
      select entry.item ->> 'productId' as product_id,
             sum((entry.item ->> 'quantity')::integer)::integer as quantity
        from jsonb_array_elements(p_items) as entry(item)
       group by entry.item ->> 'productId'
    ) as grouped
    join public.products as product on product.id = grouped.product_id;

  return query select v_transaction_id, v_invoice_no, v_grand_total;
end;
$$;

create or replace function public.lookup_customer_order(p_invoice_no text, p_phone text)
returns table (
  id uuid,
  invoice_no text,
  customer_name text,
  created_at timestamptz,
  grand_total numeric,
  status text,
  items jsonb
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select t.id,
         t.invoice_no,
         t.customer_name,
         t.created_at,
         t.grand_total,
         t.status,
         coalesce(
           jsonb_agg(
             jsonb_build_object(
               'productId', i.product_id,
               'productName', i.product_name,
               'quantity', i.quantity,
               'price', i.price,
               'subtotal', i.subtotal
             )
             order by i.created_at
           ) filter (where i.id is not null),
           '[]'::jsonb
         )
    from public.transactions as t
    left join public.transaction_items as i on i.transaction_id = t.id
   where upper(t.invoice_no) = upper(trim(p_invoice_no))
     and regexp_replace(coalesce(t.customer_phone, ''), '[^0-9]', '', 'g') =
         regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g')
     and length(regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g')) >= 8
   group by t.id;
$$;

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'Pelanggan'),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    'pelanggan'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.create_profile_for_new_user();

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_items enable row level security;

drop policy if exists "Profiles visible to self or owner" on public.profiles;
create policy "Profiles visible to self or owner"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_owner()));

drop policy if exists "Active products visible to everyone" on public.products;
create policy "Active products visible to everyone"
  on public.products for select to anon, authenticated
  using (is_active or (select public.is_staff()));

drop policy if exists "Owners manage products" on public.products;
create policy "Owners manage products"
  on public.products for all to authenticated
  using ((select public.is_owner()))
  with check ((select public.is_owner()));

drop policy if exists "Customers and staff view transactions" on public.transactions;
create policy "Customers and staff view transactions"
  on public.transactions for select to authenticated
  using (customer_id = (select auth.uid()) or (select public.is_staff()));

drop policy if exists "Staff update transaction status" on public.transactions;
create policy "Staff update transaction status"
  on public.transactions for update to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

drop policy if exists "Owners delete transactions" on public.transactions;
create policy "Owners delete transactions"
  on public.transactions for delete to authenticated
  using ((select public.is_owner()));

drop policy if exists "Customers and staff view transaction items" on public.transaction_items;
create policy "Customers and staff view transaction items"
  on public.transaction_items for select to authenticated
  using (
    exists (
      select 1
        from public.transactions
       where transactions.id = transaction_items.transaction_id
         and (transactions.customer_id = (select auth.uid()) or (select public.is_staff()))
    )
  );

grant usage on schema public to anon, authenticated;
grant select on public.products to anon, authenticated;
grant select on public.profiles, public.transactions, public.transaction_items to authenticated;
grant insert, update, delete on public.products to authenticated;
grant update (status, payment_status) on public.transactions to authenticated;
grant delete on public.transactions to authenticated;
grant usage, select on sequence public.invoice_number_seq to authenticated;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.is_owner() to authenticated;
grant execute on function public.create_customer_order(jsonb, text, text) to authenticated;
revoke all on function public.create_pos_transaction(jsonb, numeric, text, text, numeric, text, text, text) from public, anon;
grant execute on function public.create_pos_transaction(jsonb, numeric, text, text, numeric, text, text, text) to authenticated;
revoke all on function public.lookup_customer_order(text, text) from public;
grant execute on function public.lookup_customer_order(text, text) to anon, authenticated;
revoke all on function public.create_profile_for_new_user() from public, anon, authenticated;
