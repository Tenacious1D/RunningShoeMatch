begin;

-- Linked CLI tests use a temporary login that cannot access the extensions
-- schema directly. Step down to postgres inside this rollback-only transaction.
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public;

select plan(54);

select has_table('public', table_name, format('public.%s exists', table_name))
from unnest(array[
  'brands',
  'shoes',
  'retailers',
  'shoe_retailer_links',
  'ranking_categories',
  'ranking_runs',
  'ranking_results',
  'shoe_metrics'
]) as table_name;

select has_pk('public', table_name, format('public.%s has a primary key', table_name))
from unnest(array[
  'brands',
  'shoes',
  'retailers',
  'shoe_retailer_links',
  'ranking_categories',
  'ranking_runs',
  'ranking_results',
  'shoe_metrics'
]) as table_name;

select table_privs_are(
  'public',
  table_name,
  'anon',
  array['SELECT'],
  format('anon has read-only table privileges on public.%s', table_name)
)
from unnest(array[
  'brands',
  'shoes',
  'retailers',
  'shoe_retailer_links',
  'ranking_categories',
  'ranking_runs',
  'ranking_results',
  'shoe_metrics'
]) as table_name;

select table_privs_are(
  'public',
  table_name,
  'authenticated',
  array['SELECT'],
  format('authenticated has read-only table privileges on public.%s', table_name)
)
from unnest(array[
  'brands',
  'shoes',
  'retailers',
  'shoe_retailer_links',
  'ranking_categories',
  'ranking_runs',
  'ranking_results',
  'shoe_metrics'
]) as table_name;

select ok(
  relation.relrowsecurity,
  format('RLS is enabled on public.%s', relation.relname)
)
from pg_class as relation
join pg_namespace as namespace on namespace.oid = relation.relnamespace
where namespace.nspname = 'public'
  and relation.relname = any(array[
    'brands',
    'shoes',
    'retailers',
    'shoe_retailer_links',
    'ranking_categories',
    'ranking_runs',
    'ranking_results',
    'shoe_metrics'
  ]);

select has_function('public', 'set_updated_at', array[]::text[], 'updated_at trigger function exists');
select has_function('public', 'guard_published_ranking_run', array[]::text[], 'ranking run guard exists');
select has_function('public', 'guard_published_ranking_result', array[]::text[], 'ranking result guard exists');
select has_function('public', 'guard_public_shoe_metric', array[]::text[], 'public metric guard exists');

select has_trigger('public', 'brands', 'brands_set_updated_at', 'brands timestamp trigger exists');
select has_trigger('public', 'shoes', 'shoes_set_updated_at', 'shoes timestamp trigger exists');
select has_trigger('public', 'retailers', 'retailers_set_updated_at', 'retailers timestamp trigger exists');
select has_trigger('public', 'shoe_retailer_links', 'shoe_retailer_links_set_updated_at', 'retailer links timestamp trigger exists');
select has_trigger('public', 'ranking_categories', 'ranking_categories_set_updated_at', 'ranking categories timestamp trigger exists');
select has_trigger('public', 'ranking_runs', 'ranking_runs_set_updated_at', 'ranking runs timestamp trigger exists');
select has_trigger('public', 'ranking_results', 'ranking_results_set_updated_at', 'ranking results timestamp trigger exists');
select has_trigger('public', 'ranking_runs', 'ranking_runs_guard_published', 'published run guard trigger exists');
select has_trigger('public', 'ranking_results', 'ranking_results_guard_published', 'published result guard trigger exists');
select has_trigger('public', 'shoe_metrics', 'shoe_metrics_guard_public', 'public metric guard trigger exists');

select * from finish();
rollback;
