-- Running Shoe Match initial application schema.
-- Universal identifiers and relationships are relational. Evolving shoe specs,
-- calculation breakdowns, and non-ranking metadata use constrained JSON objects.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Maintains updated_at for mutable application records.';

revoke all on function public.set_updated_at() from public, anon, authenticated;

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null constraint brands_name_not_blank check (length(btrim(name)) > 0),
  slug text not null unique constraint brands_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  website_url text constraint brands_website_url_format check (website_url is null or website_url ~* '^https?://.+'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.brands is
  'Normalized running shoe manufacturers. Public visibility follows the existence of a public shoe.';

create unique index brands_name_case_insensitive_idx on public.brands (lower(name));

create table public.shoes (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete restrict,
  model_name text not null constraint shoes_model_name_not_blank check (length(btrim(model_name)) > 0),
  slug text not null unique constraint shoes_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  model_version text constraint shoes_model_version_not_blank check (model_version is null or length(btrim(model_version)) > 0),
  model_year smallint constraint shoes_model_year_range check (model_year is null or model_year between 1900 and 2200),
  status text not null default 'upcoming' constraint shoes_status_allowed check (status in ('active', 'discontinued', 'upcoming')),
  gender text not null default 'unisex' constraint shoes_gender_allowed check (gender in ('men', 'women', 'unisex')),
  is_public boolean not null default false,
  msrp numeric(10, 2) constraint shoes_msrp_nonnegative check (msrp is null or msrp >= 0),
  currency text not null default 'USD' constraint shoes_currency_format check (currency ~ '^[A-Z]{3}$'),
  short_description text,
  full_description text,
  primary_image_url text constraint shoes_primary_image_url_format check (primary_image_url is null or primary_image_url ~* '^https?://.+'),
  release_date date,
  specs jsonb not null default '{}'::jsonb constraint shoes_specs_object check (jsonb_typeof(specs) = 'object'),
  metadata jsonb not null default '{}'::jsonb constraint shoes_metadata_object check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.shoes is
  'Canonical shoe models or audience-specific variants. is_public controls public catalog visibility independently of lifecycle status.';
comment on column public.shoes.specs is
  'Evolving manufacturer specifications that are descriptive, not ranking inputs. Keep frequently queried universal fields relational.';
comment on column public.shoes.metadata is
  'Non-ranking miscellaneous data. Ranking inputs belong in shoe_metrics.';

create index shoes_brand_id_idx on public.shoes (brand_id);
create index shoes_public_status_idx on public.shoes (status, release_date desc) where is_public;

create table public.retailers (
  id uuid primary key default gen_random_uuid(),
  name text not null constraint retailers_name_not_blank check (length(btrim(name)) > 0),
  slug text not null unique constraint retailers_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  homepage_url text not null constraint retailers_homepage_url_format check (homepage_url ~* '^https?://.+'),
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.retailers is
  'Retail partners. Shoe-specific affiliate destinations belong in shoe_retailer_links.';

create unique index retailers_name_case_insensitive_idx on public.retailers (lower(name));
create index retailers_active_idx on public.retailers (slug) where active;

create table public.shoe_retailer_links (
  id uuid primary key default gen_random_uuid(),
  shoe_id uuid not null references public.shoes(id) on delete cascade,
  retailer_id uuid not null references public.retailers(id) on delete restrict,
  affiliate_url text not null constraint shoe_retailer_links_affiliate_url_format check (affiliate_url ~* '^https?://.+'),
  regular_url text constraint shoe_retailer_links_regular_url_format check (regular_url is null or regular_url ~* '^https?://.+'),
  displayed_price numeric(10, 2) constraint shoe_retailer_links_price_nonnegative check (displayed_price is null or displayed_price >= 0),
  currency text not null default 'USD' constraint shoe_retailer_links_currency_format check (currency ~ '^[A-Z]{3}$'),
  is_primary boolean not null default false,
  active boolean not null default false,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shoe_retailer_links_unique_destination unique (shoe_id, retailer_id, affiliate_url)
);

comment on table public.shoe_retailer_links is
  'Current retailer offers. A shoe may have multiple retailer links; ranking snapshots never copy these URLs.';

create index shoe_retailer_links_shoe_active_idx on public.shoe_retailer_links (shoe_id, retailer_id) where active;
create index shoe_retailer_links_retailer_id_idx on public.shoe_retailer_links (retailer_id);
create unique index shoe_retailer_links_one_active_primary_per_shoe_idx
  on public.shoe_retailer_links (shoe_id)
  where active and is_primary;

create table public.ranking_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null constraint ranking_categories_name_not_blank check (length(btrim(name)) > 0),
  slug text not null unique constraint ranking_categories_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.ranking_categories is
  'Stable category identities used across independently versioned ranking runs.';

create unique index ranking_categories_name_case_insensitive_idx on public.ranking_categories (lower(name));
create index ranking_categories_active_idx on public.ranking_categories (slug) where active;

create table public.ranking_runs (
  id uuid primary key default gen_random_uuid(),
  name text not null constraint ranking_runs_name_not_blank check (length(btrim(name)) > 0),
  effective_date date not null,
  methodology_version text not null constraint ranking_runs_methodology_version_not_blank check (length(btrim(methodology_version)) > 0),
  notes text,
  status text not null default 'draft' constraint ranking_runs_status_allowed check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ranking_runs_unique_name_date unique (name, effective_date),
  constraint ranking_runs_publication_state check (
    (status = 'draft' and published_at is null)
    or (status = 'published' and published_at is not null)
  )
);

comment on table public.ranking_runs is
  'A versioned ranking snapshot boundary. Each new publication period creates a new run instead of overwriting history.';
comment on column public.ranking_runs.methodology_version is
  'Identifies the deterministic ruleset used so historical outputs remain reproducible.';

create index ranking_runs_effective_date_idx on public.ranking_runs (effective_date desc);
create index ranking_runs_published_idx on public.ranking_runs (effective_date desc, published_at desc) where status = 'published';

create table public.ranking_results (
  id uuid primary key default gen_random_uuid(),
  ranking_run_id uuid not null references public.ranking_runs(id) on delete cascade,
  ranking_category_id uuid not null references public.ranking_categories(id) on delete restrict,
  shoe_id uuid not null references public.shoes(id) on delete restrict,
  score numeric(8, 4) not null constraint ranking_results_score_range check (score between 0 and 100),
  rank integer not null constraint ranking_results_rank_positive check (rank > 0),
  component_scores jsonb not null default '{}'::jsonb constraint ranking_results_component_scores_object check (jsonb_typeof(component_scores) = 'object'),
  metadata jsonb not null default '{}'::jsonb constraint ranking_results_metadata_object check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ranking_results_one_shoe_per_category_run unique (ranking_run_id, ranking_category_id, shoe_id)
);

comment on table public.ranking_results is
  'A shoe placement inside one category and immutable published run. Duplicate ranks remain possible until a future tie policy is chosen.';
comment on column public.ranking_results.component_scores is
  'Version-specific scoring breakdown. Keys may evolve with methodology versions while total score and rank remain queryable.';
comment on column public.ranking_results.metadata is
  'Supporting calculation provenance or display data that is not part of the universal result shape.';

create index ranking_results_run_category_rank_idx
  on public.ranking_results (ranking_run_id, ranking_category_id, rank);
create index ranking_results_category_run_idx
  on public.ranking_results (ranking_category_id, ranking_run_id);
create index ranking_results_shoe_id_idx on public.ranking_results (shoe_id);

create table public.shoe_metrics (
  id uuid primary key default gen_random_uuid(),
  shoe_id uuid not null references public.shoes(id) on delete cascade,
  metric_key text not null constraint shoe_metrics_key_format check (metric_key ~ '^[a-z][a-z0-9_]*$'),
  value numeric not null,
  normalized_value numeric(8, 4) constraint shoe_metrics_normalized_value_range check (normalized_value is null or normalized_value between 0 and 100),
  unit text constraint shoe_metrics_unit_not_blank check (unit is null or length(btrim(unit)) > 0),
  data_source text not null constraint shoe_metrics_data_source_not_blank check (length(btrim(data_source)) > 0),
  source_reference text,
  effective_date date not null,
  metric_version text not null constraint shoe_metrics_version_not_blank check (length(btrim(metric_version)) > 0),
  confidence numeric(5, 4) constraint shoe_metrics_confidence_range check (confidence is null or confidence between 0 and 1),
  notes text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  constraint shoe_metrics_version_identity unique (
    shoe_id,
    metric_key,
    effective_date,
    metric_version,
    data_source
  )
);

comment on table public.shoe_metrics is
  'Append-oriented, versioned numeric observations used by future ranking and matching engines. New metric keys require rows, not schema migrations.';
comment on column public.shoe_metrics.value is
  'Source-scale numeric value. Unit documents its meaning; normalized_value optionally provides a comparable 0-100 score.';
comment on column public.shoe_metrics.metric_version is
  'Version of the definition or measurement process for this metric key.';
comment on column public.shoe_metrics.is_public is
  'Only reviewed metric rows marked public are readable through the public Data API.';

create index shoe_metrics_shoe_key_effective_idx
  on public.shoe_metrics (shoe_id, metric_key, effective_date desc, created_at desc);
create index shoe_metrics_key_effective_idx
  on public.shoe_metrics (metric_key, effective_date desc)
  where is_public;

-- Keep mutable records' timestamps consistent without relying on application code.
create trigger brands_set_updated_at
before update on public.brands
for each row execute function public.set_updated_at();

create trigger shoes_set_updated_at
before update on public.shoes
for each row execute function public.set_updated_at();

create trigger retailers_set_updated_at
before update on public.retailers
for each row execute function public.set_updated_at();

create trigger shoe_retailer_links_set_updated_at
before update on public.shoe_retailer_links
for each row execute function public.set_updated_at();

create trigger ranking_categories_set_updated_at
before update on public.ranking_categories
for each row execute function public.set_updated_at();

create trigger ranking_runs_set_updated_at
before update on public.ranking_runs
for each row execute function public.set_updated_at();

create trigger ranking_results_set_updated_at
before update on public.ranking_results
for each row execute function public.set_updated_at();

-- Published ranking snapshots are immutable. Draft runs and results can be
-- reviewed and corrected before the run transitions to published.
create or replace function public.guard_published_ranking_run()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'published' then
    raise exception 'Published ranking runs are immutable';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

comment on function public.guard_published_ranking_run() is
  'Prevents updates or deletion after a ranking run has been published.';

revoke all on function public.guard_published_ranking_run() from public, anon, authenticated;

create trigger ranking_runs_guard_published
before update or delete on public.ranking_runs
for each row execute function public.guard_published_ranking_run();

create or replace function public.guard_published_ranking_result()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  target_run_id uuid;
begin
  if tg_op = 'INSERT' then
    target_run_id := new.ranking_run_id;
  else
    target_run_id := old.ranking_run_id;
  end if;

  if exists (
    select 1
    from public.ranking_runs
    where id = target_run_id
      and status = 'published'
  ) then
    raise exception 'Results in published ranking runs are immutable';
  end if;

  if tg_op = 'UPDATE' and new.ranking_run_id <> old.ranking_run_id and exists (
    select 1
    from public.ranking_runs
    where id = new.ranking_run_id
      and status = 'published'
  ) then
    raise exception 'Results cannot be moved into a published ranking run';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

comment on function public.guard_published_ranking_result() is
  'Prevents inserts, updates, or deletes that would mutate a published ranking snapshot.';

revoke all on function public.guard_published_ranking_result() from public, anon, authenticated;

create trigger ranking_results_guard_published
before insert or update or delete on public.ranking_results
for each row execute function public.guard_published_ranking_result();

-- A reviewed metric observation becomes immutable once public. Corrections are
-- represented by a new effective/versioned row rather than silent replacement.
create or replace function public.guard_public_shoe_metric()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.is_public then
    raise exception 'Public shoe metric rows are immutable';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

comment on function public.guard_public_shoe_metric() is
  'Preserves public metric history; publish a replacement version instead of modifying a public observation.';

revoke all on function public.guard_public_shoe_metric() from public, anon, authenticated;

create trigger shoe_metrics_guard_public
before update or delete on public.shoe_metrics
for each row execute function public.guard_public_shoe_metric();

-- Explicit Data API grants: anonymous and signed-in public users may only
-- select. No insert, update, delete, truncate, references, or trigger rights.
revoke all on table
  public.brands,
  public.shoes,
  public.retailers,
  public.shoe_retailer_links,
  public.ranking_categories,
  public.ranking_runs,
  public.ranking_results,
  public.shoe_metrics
from anon, authenticated;

grant select on table
  public.brands,
  public.shoes,
  public.retailers,
  public.shoe_retailer_links,
  public.ranking_categories,
  public.ranking_runs,
  public.ranking_results,
  public.shoe_metrics
to anon, authenticated;

-- The server-only secret key resolves to service_role. Keep its full access
-- explicit because local and hosted Data API auto-exposure defaults can differ.
grant all privileges on table
  public.brands,
  public.shoes,
  public.retailers,
  public.shoe_retailer_links,
  public.ranking_categories,
  public.ranking_runs,
  public.ranking_results,
  public.shoe_metrics
to service_role;

grant execute on function public.set_updated_at() to service_role;
grant execute on function public.guard_published_ranking_run() to service_role;
grant execute on function public.guard_published_ranking_result() to service_role;
grant execute on function public.guard_public_shoe_metric() to service_role;

alter table public.brands enable row level security;
alter table public.shoes enable row level security;
alter table public.retailers enable row level security;
alter table public.shoe_retailer_links enable row level security;
alter table public.ranking_categories enable row level security;
alter table public.ranking_runs enable row level security;
alter table public.ranking_results enable row level security;
alter table public.shoe_metrics enable row level security;

create policy brands_public_read
on public.brands
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.shoes
    where shoes.brand_id = brands.id
      and shoes.is_public
  )
);

create policy shoes_public_read
on public.shoes
for select
to anon, authenticated
using (is_public);

create policy retailers_public_read
on public.retailers
for select
to anon, authenticated
using (active);

create policy shoe_retailer_links_public_read
on public.shoe_retailer_links
for select
to anon, authenticated
using (
  active
  and exists (
    select 1
    from public.shoes
    where shoes.id = shoe_retailer_links.shoe_id
      and shoes.is_public
  )
  and exists (
    select 1
    from public.retailers
    where retailers.id = shoe_retailer_links.retailer_id
      and retailers.active
  )
);

create policy ranking_categories_public_read
on public.ranking_categories
for select
to anon, authenticated
using (active);

create policy ranking_runs_public_read
on public.ranking_runs
for select
to anon, authenticated
using (status = 'published' and published_at <= now());

create policy ranking_results_public_read
on public.ranking_results
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.ranking_runs
    where ranking_runs.id = ranking_results.ranking_run_id
      and ranking_runs.status = 'published'
      and ranking_runs.published_at <= now()
  )
  and exists (
    select 1
    from public.ranking_categories
    where ranking_categories.id = ranking_results.ranking_category_id
      and ranking_categories.active
  )
  and exists (
    select 1
    from public.shoes
    where shoes.id = ranking_results.shoe_id
      and shoes.is_public
  )
);

create policy shoe_metrics_public_read
on public.shoe_metrics
for select
to anon, authenticated
using (
  is_public
  and exists (
    select 1
    from public.shoes
    where shoes.id = shoe_metrics.shoe_id
      and shoes.is_public
  )
);