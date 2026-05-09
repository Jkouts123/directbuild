-- NSW Property Sales suburb summary storage
--
-- Required server-side environment variables:
-- SUPABASE_URL
-- SUPABASE_SERVICE_ROLE_KEY
--
-- Do not expose SUPABASE_SERVICE_ROLE_KEY through NEXT_PUBLIC_* variables.

create table if not exists public.nsw_property_sales_suburb_summary (
  suburb text primary key,
  state text not null default 'NSW',
  sales_count integer not null default 0,
  median_sale_price numeric,
  earliest_contract_date date,
  latest_contract_date date,
  earliest_settlement_date date,
  latest_settlement_date date,
  property_turnover_signal text,
  sample_size integer not null default 0,
  generated_at timestamptz,
  data_basis text
);

create index if not exists nsw_property_sales_suburb_summary_state_idx
on public.nsw_property_sales_suburb_summary (state);
