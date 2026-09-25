-- Serveone Quotation V11
-- Quotation number format becomes SMI/YYYY-MM/0001.
-- p_client_code remains in the function signature for application compatibility,
-- but is intentionally not included in the generated quotation number.
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
