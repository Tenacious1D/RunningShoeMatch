-- Deterministic automated-ranking inputs for Overall Score v1.
-- Generated output still enters the existing immutable, draft-first snapshot workflow.

begin;

create table public.shoe_review_observations (
  id uuid primary key default gen_random_uuid(),
  shoe_id uuid not null references public.shoes(id) on delete cascade,
  source_key text not null constraint shoe_review_observations_source_allowed check (
    source_key in ('running-warehouse', 'fleet-feet', 'zappos', 'marathon-sports', 'road-runner-sports')
  ),
  rating numeric(3, 2) not null constraint shoe_review_observations_rating_range check (rating between 1 and 5),
  review_count integer not null constraint shoe_review_observations_count_nonnegative check (review_count >= 0),
  product_url text constraint shoe_review_observations_url_format check (product_url is null or product_url ~* '^https?://.+'),
  observed_at date not null,
  verification_status text not null constraint shoe_review_observations_verification_allowed check (
    verification_status in ('source_checked', 'cross_checked')
  ),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shoe_review_observations_unique_snapshot unique (shoe_id, source_key, observed_at)
);

comment on table public.shoe_review_observations is
  'Dated retailer rating and review-count observations used by Overall Score v1. Historical observations are retained.';
comment on column public.shoe_review_observations.source_key is
  'Controlled rating source identity. Availability counting is separate and comes from active retailer links.';

create index shoe_review_observations_shoe_date_idx
  on public.shoe_review_observations (shoe_id, observed_at desc);
create index shoe_review_observations_source_date_idx
  on public.shoe_review_observations (source_key, observed_at desc);

create trigger shoe_review_observations_set_updated_at
before update on public.shoe_review_observations
for each row execute function public.set_updated_at();

create table public.shoe_ranking_inputs (
  id uuid primary key default gen_random_uuid(),
  shoe_id uuid not null references public.shoes(id) on delete cascade,
  methodology_version text not null constraint shoe_ranking_inputs_methodology_not_blank check (length(btrim(methodology_version)) > 0),
  effective_date date not null,
  fit_classification text not null constraint shoe_ranking_inputs_fit_allowed check (fit_classification in ('great', 'ok', 'bad')),
  cushion_classification text not null constraint shoe_ranking_inputs_cushion_allowed check (cushion_classification in ('plush', 'balanced', 'firm')),
  reviewed_at date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shoe_ranking_inputs_unique_version unique (shoe_id, methodology_version, effective_date)
);

comment on table public.shoe_ranking_inputs is
  'Versioned human-reviewed categorical inputs required by a named ranking methodology. These are not Metric Vocabulary v1 scores.';

create index shoe_ranking_inputs_lookup_idx
  on public.shoe_ranking_inputs (methodology_version, effective_date desc, shoe_id);

create trigger shoe_ranking_inputs_set_updated_at
before update on public.shoe_ranking_inputs
for each row execute function public.set_updated_at();

create table public.shoe_ranking_category_eligibility (
  id uuid primary key default gen_random_uuid(),
  shoe_id uuid not null references public.shoes(id) on delete cascade,
  ranking_category_id uuid not null references public.ranking_categories(id) on delete restrict,
  methodology_version text not null constraint shoe_ranking_eligibility_methodology_not_blank check (length(btrim(methodology_version)) > 0),
  effective_date date not null,
  reviewed_at date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shoe_ranking_eligibility_unique_version unique (
    shoe_id, ranking_category_id, methodology_version, effective_date
  )
);

comment on table public.shoe_ranking_category_eligibility is
  'Dated, human-reviewed category inclusion. The generator never infers category membership from marketing copy.';

create index shoe_ranking_eligibility_lookup_idx
  on public.shoe_ranking_category_eligibility (methodology_version, effective_date desc, ranking_category_id, shoe_id);

create trigger shoe_ranking_category_eligibility_set_updated_at
before update on public.shoe_ranking_category_eligibility
for each row execute function public.set_updated_at();

alter table public.shoe_review_observations enable row level security;
alter table public.shoe_ranking_inputs enable row level security;
alter table public.shoe_ranking_category_eligibility enable row level security;

revoke all on table public.shoe_review_observations, public.shoe_ranking_inputs, public.shoe_ranking_category_eligibility from anon, authenticated;
grant select on table public.shoe_review_observations, public.shoe_ranking_inputs, public.shoe_ranking_category_eligibility to authenticated;
grant all privileges on table public.shoe_review_observations, public.shoe_ranking_inputs, public.shoe_ranking_category_eligibility to service_role;

create policy shoe_review_observations_admin_read on public.shoe_review_observations
for select to authenticated using ((select private.is_admin()));
create policy shoe_ranking_inputs_admin_read on public.shoe_ranking_inputs
for select to authenticated using ((select private.is_admin()));
create policy shoe_ranking_eligibility_admin_read on public.shoe_ranking_category_eligibility
for select to authenticated using ((select private.is_admin()));

insert into public.ranking_categories (name, slug, description, active)
values
  ('Neutral Road', 'neutral-road', 'Neutral road running shoes.', true),
  ('Stability Road', 'stability-road', 'Road shoes with stability-oriented support.', true),
  ('Race Road', 'race-road', 'Road racing shoes.', true),
  ('Light Trail / Hybrid', 'light-trail-hybrid', 'Road-to-trail and light-trail shoes.', true),
  ('Technical Trail', 'technical-trail', 'Shoes for technical trail terrain.', true),
  ('Cross Country Spikes', 'cross-country-spikes', 'Cross-country racing spikes.', true),
  ('Distance Spikes', 'distance-spikes', 'Track spikes for distance events.', true),
  ('Daily Trainers', 'daily-trainers', 'Versatile shoes for regular daily mileage.', true),
  ('Long Distance Road', 'long-distance-road', 'Road shoes suited to sustained distance.', true),
  ('Lightweight Trainers', 'lightweight-trainers', 'Lower-weight training shoes.', true),
  ('Speed Trainers', 'speed-trainers', 'Training shoes intended for faster sessions.', true),
  ('Motion Control Road', 'motion-control-road', 'Road shoes with motion-control support.', true),
  ('Wide Fit Road', 'wide-fit-road', 'Road shoes offered for wider feet.', true),
  ('Budget Road', 'budget-road', 'Road shoes emphasizing accessible price and value.', true),
  ('Premium Road', 'premium-road', 'Premium-positioned road shoes.', true),
  ('Distance Trail', 'distance-trail', 'Trail shoes suited to sustained distance.', true),
  ('Racing Trail', 'racing-trail', 'Trail racing shoes.', true),
  ('Cushion Trail', 'cushion-trail', 'Trail shoes emphasizing underfoot cushioning.', true),
  ('Waterproof Trail', 'waterproof-trail', 'Trail shoes with a waterproof construction.', true),
  ('Racing Flats Road', 'racing-flats-road', 'Traditional lower-profile road racing shoes.', true),
  ('Mid-Distance Spikes', 'mid-distance-spikes', 'Track spikes for middle-distance events.', true),
  ('Sprint Spikes', 'sprint-spikes', 'Track spikes for sprint events.', true)
on conflict do nothing;

update public.ranking_categories
set active = true
where slug in (
  'neutral-road', 'stability-road', 'race-road', 'light-trail-hybrid', 'technical-trail',
  'cross-country-spikes', 'distance-spikes', 'daily-trainers', 'long-distance-road',
  'lightweight-trainers', 'speed-trainers', 'motion-control-road', 'wide-fit-road',
  'budget-road', 'premium-road', 'distance-trail', 'racing-trail', 'cushion-trail',
  'waterproof-trail', 'racing-flats-road', 'mid-distance-spikes', 'sprint-spikes'
);

create or replace function public.import_ranking_review_observations(p_rows jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  processed_count integer := 0;
begin
  if jsonb_typeof(p_rows) <> 'array' then
    raise exception 'Review observation payload must be a JSON array';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_rows) as incoming(shoe_slug text, source_key text, observed_at date)
    group by shoe_slug, source_key, observed_at
    having count(*) > 1
  ) then
    raise exception 'Duplicate review observations are not allowed in one import';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_rows) as incoming(shoe_slug text)
    left join public.shoes on shoes.slug = incoming.shoe_slug
    where shoes.id is null
  ) then
    raise exception 'Every review observation must reference an existing shoe';
  end if;

  insert into public.shoe_review_observations (
    shoe_id, source_key, rating, review_count, product_url, observed_at, verification_status, notes
  )
  select
    shoes.id, incoming.source_key, incoming.rating, incoming.review_count, incoming.product_url,
    incoming.observed_at, incoming.verification_status, incoming.notes
  from jsonb_to_recordset(p_rows) as incoming(
    shoe_slug text, source_key text, rating numeric, review_count integer,
    product_url text, observed_at date, verification_status text, notes text
  )
  join public.shoes on shoes.slug = incoming.shoe_slug
  on conflict (shoe_id, source_key, observed_at) do update set
    rating = excluded.rating,
    review_count = excluded.review_count,
    product_url = excluded.product_url,
    verification_status = excluded.verification_status,
    notes = excluded.notes;

  get diagnostics processed_count = row_count;
  return jsonb_build_object('processed_rows', processed_count);
end;
$$;

revoke all on function public.import_ranking_review_observations(jsonb) from public, anon, authenticated;
grant execute on function public.import_ranking_review_observations(jsonb) to service_role;

create or replace function public.import_shoe_ranking_inputs(p_rows jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  processed_input_count integer := 0;
  processed_eligibility_count integer := 0;
begin
  if jsonb_typeof(p_rows) <> 'array' then
    raise exception 'Ranking input payload must be a JSON array';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_rows) as incoming(shoe_slug text, methodology_version text, effective_date date)
    group by shoe_slug, methodology_version, effective_date
    having count(*) > 1
  ) then
    raise exception 'Duplicate shoe ranking input versions are not allowed in one import';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_rows) as incoming(shoe_slug text)
    left join public.shoes on shoes.slug = incoming.shoe_slug
    where shoes.id is null
  ) then
    raise exception 'Every ranking input must reference an existing shoe';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_rows) as incoming(category_slugs jsonb)
    cross join lateral jsonb_array_elements_text(incoming.category_slugs) as category_item(slug)
    left join public.ranking_categories on ranking_categories.slug = category_item.slug and ranking_categories.active
    where ranking_categories.id is null
  ) then
    raise exception 'Every eligibility value must reference an active ranking category';
  end if;

  insert into public.shoe_ranking_inputs (
    shoe_id, methodology_version, effective_date, fit_classification, cushion_classification, reviewed_at, notes
  )
  select
    shoes.id, incoming.methodology_version, incoming.effective_date, incoming.fit_classification,
    incoming.cushion_classification, incoming.reviewed_at, incoming.notes
  from jsonb_to_recordset(p_rows) as incoming(
    shoe_slug text, methodology_version text, effective_date date, fit_classification text,
    cushion_classification text, category_slugs jsonb, reviewed_at date, notes text
  )
  join public.shoes on shoes.slug = incoming.shoe_slug
  on conflict (shoe_id, methodology_version, effective_date) do update set
    fit_classification = excluded.fit_classification,
    cushion_classification = excluded.cushion_classification,
    reviewed_at = excluded.reviewed_at,
    notes = excluded.notes;

  get diagnostics processed_input_count = row_count;

  delete from public.shoe_ranking_category_eligibility eligibility
  using jsonb_to_recordset(p_rows) as incoming(shoe_slug text, methodology_version text, effective_date date)
  join public.shoes on shoes.slug = incoming.shoe_slug
  where eligibility.shoe_id = shoes.id
    and eligibility.methodology_version = incoming.methodology_version
    and eligibility.effective_date = incoming.effective_date;

  insert into public.shoe_ranking_category_eligibility (
    shoe_id, ranking_category_id, methodology_version, effective_date, reviewed_at, notes
  )
  select
    shoes.id, ranking_categories.id, incoming.methodology_version, incoming.effective_date,
    incoming.reviewed_at, incoming.notes
  from jsonb_to_recordset(p_rows) as incoming(
    shoe_slug text, methodology_version text, effective_date date, fit_classification text,
    cushion_classification text, category_slugs jsonb, reviewed_at date, notes text
  )
  join public.shoes on shoes.slug = incoming.shoe_slug
  cross join lateral jsonb_array_elements_text(incoming.category_slugs) as category_item(slug)
  join public.ranking_categories on ranking_categories.slug = category_item.slug;

  get diagnostics processed_eligibility_count = row_count;
  return jsonb_build_object(
    'processed_inputs', processed_input_count,
    'processed_eligibilities', processed_eligibility_count
  );
end;
$$;

revoke all on function public.import_shoe_ranking_inputs(jsonb) from public, anon, authenticated;
grant execute on function public.import_shoe_ranking_inputs(jsonb) to service_role;

commit;
