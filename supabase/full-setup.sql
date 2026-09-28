-- Serveone Quotation - current fresh setup.
-- Fresh setup. Existing deployments upgrading from V23 should run supabase/v24-upgrade.sql once.
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


create table if not exists public.app_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value)
values (
  'company_address',
  'Jalan Kenari Raya Blok G No. 19, Kawasan Delta Silicon V, Lippo Cikarang, RT. 000 RW. 000, Cicau, Cikarang Pusat, Kab. Bekasi, Jawa Barat'
)
on conflict (key) do nothing;

create table if not exists public.quotation_sequences (
  quote_month date primary key,
  last_number bigint not null check (last_number > 0)
);

create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(),
  quotation_no text not null unique,
  base_quotation_no text not null,
  revision_no integer not null default 0 check (revision_no >= 0),
  is_latest boolean not null default true,
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
create unique index if not exists quotations_base_revision_uidx on public.quotations(base_quotation_no, revision_no);
create index if not exists quotations_base_no_idx on public.quotations(base_quotation_no);
create index if not exists quotations_latest_idx on public.quotations(is_latest, base_quotation_no);

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



create or replace function public.create_quotation_revision(
  p_source_id uuid,
  p_quotation_date date,
  p_client_name text,
  p_client_code text,
  p_sales_pic_id uuid,
  p_sales_name text,
  p_total_amount numeric,
  p_content_hash text,
  p_content jsonb
) returns public.quotations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_source public.quotations%rowtype;
  v_new public.quotations%rowtype;
  v_base text;
  v_next integer;
  v_no text;
begin
  select * into v_source from public.quotations where id = p_source_id;
  if not found then raise exception 'Source quotation not found'; end if;
  v_base := coalesce(nullif(v_source.base_quotation_no, ''), pg_catalog.regexp_replace(v_source.quotation_no, '/REV-[0-9]+$', '', 'i'));
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_base, 0));
  select coalesce(max(revision_no), 0) + 1 into v_next from public.quotations where base_quotation_no = v_base;
  if v_next < 1 then v_next := 1; end if;
  v_no := v_base || '/REV-' || v_next::text;
  update public.quotations set is_latest = false where base_quotation_no = v_base;
  insert into public.quotations (quotation_no,base_quotation_no,revision_no,is_latest,quotation_date,client_id,client_name,client_code,sales_pic_id,sales_name,total_amount,content_hash,content,source_quotation_id)
  values (v_no,v_base,v_next,true,p_quotation_date,null,p_client_name,coalesce(p_client_code,''),p_sales_pic_id,p_sales_name,p_total_amount,p_content_hash,p_content,p_source_id)
  returning * into v_new;
  return v_new;
end;
$$;

revoke all on function public.create_quotation_revision(uuid,date,text,text,uuid,text,numeric,text,jsonb) from public, anon, authenticated;
grant execute on function public.create_quotation_revision(uuid,date,text,text,uuid,text,numeric,text,jsonb) to service_role;

-- Logo and signature are application assets under /public.
