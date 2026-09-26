-- Serveone Quotation V24 upgrade
-- Run ONCE in Supabase SQL Editor for an existing deployment.

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
