-- Serveone Quotation V3: Register/Search Member directory
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
drop index if exists public.member_directory_mem_uq;
create unique index member_directory_mem_uq on public.member_directory(mem_id);
create index if not exists member_directory_op_unit_idx on public.member_directory(op_unit_name);
create index if not exists member_directory_client_idx on public.member_directory(client_name);
create index if not exists member_directory_member_idx on public.member_directory(member_name);

create table if not exists public.client_code_registry (
  client_name text primary key,
  client_code text not null unique,
  updated_at timestamptz not null default now()
);

alter table public.member_directory enable row level security;
alter table public.client_code_registry enable row level security;

-- Existing quotations remain valid. New V3 quotation content includes clientNm in JSON.
