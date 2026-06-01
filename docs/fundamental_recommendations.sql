-- Run once in the Supabase SQL editor before uploading fundamental predictions.
-- The uploader upserts on (ticker, context_end_quarter, forecast_year).

create table if not exists public.fundamental_recommendations (
  id bigint generated always as identity primary key,
  run_timestamp timestamptz not null,
  ticker text not null,
  context_start_quarter date not null,
  context_end_quarter date not null,
  decision_date date not null,
  forecast_end_date date not null,
  context_year integer not null,
  forecast_year integer not null,
  predicted_class smallint not null check (predicted_class in (0, 1, 2)),
  predicted_direction text not null check (predicted_direction in ('down', 'flat', 'up')),
  recommendation text not null check (recommendation in ('SELL', 'HOLD', 'BUY')),
  confidence double precision not null check (confidence >= 0 and confidence <= 1),
  actual_class smallint check (actual_class in (0, 1, 2)),
  actual_direction text check (actual_direction in ('down', 'flat', 'up')),
  forward_return double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fundamental_recommendations_unique_prediction
    unique (ticker, context_end_quarter, forecast_year)
);

create index if not exists fundamental_recommendations_latest_idx
  on public.fundamental_recommendations (context_end_quarter desc, predicted_direction, confidence desc);

create index if not exists fundamental_recommendations_ticker_idx
  on public.fundamental_recommendations (ticker, context_end_quarter desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_fundamental_recommendations_updated_at on public.fundamental_recommendations;
create trigger set_fundamental_recommendations_updated_at
before update on public.fundamental_recommendations
for each row
execute function public.set_updated_at();

alter table public.fundamental_recommendations enable row level security;

drop policy if exists "Public can read fundamental recommendations" on public.fundamental_recommendations;
create policy "Public can read fundamental recommendations"
on public.fundamental_recommendations
for select
to anon, authenticated
using (true);

-- Do not add a public insert/update policy. Use SUPABASE_SERVICE_ROLE_KEY or
-- SUPABASE_RECOMMENDATIONS_KEY locally to write rows.
