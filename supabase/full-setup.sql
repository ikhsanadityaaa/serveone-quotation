-- Serveone Quotation - current fresh setup.
-- Existing deployments do NOT need to run this file again.
create extension if not exists pgcrypto;

create table if not exists public.sales_people (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists sales_people_name_idx on public.sales_people(name);

create table if not exists public.directors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text not null default 'President Director',
  signature_path text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.member_directory (
  id uuid primary key default gen_random_uuid(),
  mem_id text,
  member_name text not null,
  op_unit_id text,
  op_unit_name text not null,
  client_id_external text,
  client_name text not null,
  address text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists member_directory_op_unit_idx on public.member_directory(op_unit_name);
create index if not exists member_directory_member_idx on public.member_directory(member_name);

create table if not exists public.quotation_sequences (
  quote_month date primary key,
  last_number bigint not null check (last_number > 0)
);

create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(),
  quotation_no text not null unique,
  quotation_date date not null,
  client_id uuid,
  client_name text not null,
  client_code text not null default '',
  sales_pic_id uuid references public.sales_people(id),
  sales_name text not null,
  total_amount numeric(18,2) not null default 0 check (total_amount >= 0),
  content_hash text not null,
  content jsonb not null,
  source_quotation_id uuid references public.quotations(id),
  created_at timestamptz not null default now()
);
create index if not exists quotations_created_at_idx on public.quotations(created_at desc);
create index if not exists quotations_client_name_idx on public.quotations(client_name);
create index if not exists quotations_sales_name_idx on public.quotations(sales_name);

create or replace function public.allocate_quotation_number(
  p_client_code text,
  p_quote_date date
) returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_month date := date_trunc('month', p_quote_date)::date;
  v_number bigint;
begin
  insert into public.quotation_sequences (quote_month, last_number)
  values (v_month, 1)
  on conflict (quote_month) do update
    set last_number = public.quotation_sequences.last_number + 1
  returning last_number into v_number;

  return format(
    'SMI/%s/%s',
    to_char(p_quote_date, 'YYYY-MM'),
    lpad(v_number::text, 4, '0')
  );
end;
$$;

revoke all on function public.allocate_quotation_number(text, date) from public, anon, authenticated;
grant execute on function public.allocate_quotation_number(text, date) to service_role;

-- Logo and signature are application assets under /public.
