-- Serveone Quotation V41 upgrade
-- Run ONCE in Supabase SQL Editor BEFORE deploying V41.
-- Adds revision grouping so KPI/reporting can use only the newest revision.

alter table public.quotations
  add column if not exists base_quotation_no text,
  add column if not exists revision_no integer not null default 0,
  add column if not exists is_latest boolean not null default true;

-- Backfill existing quotation chains. Existing historical quotation_no values are
-- intentionally preserved; only future revisions use /REV-N naming.
with recursive quote_chain as (
  select
    q.id,
    q.source_quotation_id,
    q.id as root_id,
    q.quotation_no as root_no,
    array[q.id]::uuid[] as path
  from public.quotations q
  where q.source_quotation_id is null

  union all

  select
    child.id,
    child.source_quotation_id,
    parent.root_id,
    parent.root_no,
    parent.path || child.id
  from public.quotations child
  join quote_chain parent on child.source_quotation_id = parent.id
  where not child.id = any(parent.path)
)
update public.quotations q
set base_quotation_no = c.root_no
from quote_chain c
where q.id = c.id
  and (q.base_quotation_no is null or btrim(q.base_quotation_no) = '');

-- Any orphaned/legacy row that could not be resolved becomes its own base quotation.
update public.quotations
set base_quotation_no = quotation_no
where base_quotation_no is null or btrim(base_quotation_no) = '';

-- Number existing revisions in chronological order inside each base quotation.
with ranked as (
  select
    id,
    (row_number() over (
      partition by base_quotation_no
      order by created_at asc, id asc
    ) - 1)::integer as rev
  from public.quotations
)
update public.quotations q
set revision_no = ranked.rev
from ranked
where q.id = ranked.id;

update public.quotations set is_latest = false;

with newest as (
  select distinct on (base_quotation_no)
    id
  from public.quotations
  order by base_quotation_no, revision_no desc, created_at desc, id desc
)
update public.quotations q
set is_latest = true
from newest
where q.id = newest.id;

alter table public.quotations
  alter column base_quotation_no set not null;

create unique index if not exists quotations_base_revision_uidx
  on public.quotations(base_quotation_no, revision_no);

create index if not exists quotations_base_no_idx
  on public.quotations(base_quotation_no);

create index if not exists quotations_latest_idx
  on public.quotations(is_latest, base_quotation_no);

-- Atomically creates the next revision for a quotation group.
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
  select * into v_source
  from public.quotations
  where id = p_source_id;

  if not found then
    raise exception 'Source quotation not found';
  end if;

  v_base := coalesce(
    nullif(v_source.base_quotation_no, ''),
    pg_catalog.regexp_replace(v_source.quotation_no, '/REV-[0-9]+$', '', 'i')
  );

  -- Serialize revisions of the same quotation so two users cannot receive
  -- the same REV number at the same time.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_base, 0));

  select coalesce(max(revision_no), 0) + 1
    into v_next
  from public.quotations
  where base_quotation_no = v_base;

  if v_next < 1 then
    v_next := 1;
  end if;

  v_no := v_base || '/REV-' || v_next::text;

  update public.quotations
  set is_latest = false
  where base_quotation_no = v_base;

  insert into public.quotations (
    quotation_no,
    base_quotation_no,
    revision_no,
    is_latest,
    quotation_date,
    client_id,
    client_name,
    client_code,
    sales_pic_id,
    sales_name,
    total_amount,
    content_hash,
    content,
    source_quotation_id
  ) values (
    v_no,
    v_base,
    v_next,
    true,
    p_quotation_date,
    null,
    p_client_name,
    coalesce(p_client_code, ''),
    p_sales_pic_id,
    p_sales_name,
    p_total_amount,
    p_content_hash,
    p_content,
    p_source_id
  )
  returning * into v_new;

  return v_new;
end;
$$;

revoke all on function public.create_quotation_revision(uuid,date,text,text,uuid,text,numeric,text,jsonb)
  from public, anon, authenticated;
grant execute on function public.create_quotation_revision(uuid,date,text,text,uuid,text,numeric,text,jsonb)
  to service_role;
