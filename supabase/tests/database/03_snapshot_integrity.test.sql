begin;

-- Linked CLI tests use a temporary login that cannot access the extensions
-- schema directly. Step down to postgres inside this rollback-only transaction.
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public;

select plan(8);

insert into public.brands (id, name, slug)
values ('10000000-0000-0000-0000-000000000001', 'Integrity Brand', 'integrity-brand');

insert into public.shoes (id, brand_id, model_name, slug, status, is_public)
values ('10000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000001', 'Integrity Shoe', 'integrity-shoe', 'active', true);

insert into public.retailers (id, name, slug, homepage_url, active)
values ('10000000-0000-0000-0000-000000000021', 'Integrity Retailer', 'integrity-retailer', 'https://integrity.example', true);

insert into public.shoe_retailer_links (id, shoe_id, retailer_id, affiliate_url, active, is_primary)
values ('10000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000021', 'https://integrity.example/one', true, true);

insert into public.ranking_categories (id, name, slug, active)
values ('10000000-0000-0000-0000-000000000041', 'Integrity Category', 'integrity-category', true);

insert into public.ranking_runs (id, name, effective_date, methodology_version)
values ('10000000-0000-0000-0000-000000000051', 'Integrity Run', '2026-09-01', 'v1');

insert into public.ranking_results (id, ranking_run_id, ranking_category_id, shoe_id, score, rank)
values ('10000000-0000-0000-0000-000000000061', '10000000-0000-0000-0000-000000000051', '10000000-0000-0000-0000-000000000041', '10000000-0000-0000-0000-000000000011', 90, 1);

select throws_ok(
  $$insert into public.ranking_results (id, ranking_run_id, ranking_category_id, shoe_id, score, rank) values ('10000000-0000-0000-0000-000000000062', '10000000-0000-0000-0000-000000000051', '10000000-0000-0000-0000-000000000041', '10000000-0000-0000-0000-000000000011', 80, 2)$$,
  '23505',
  null,
  'a shoe cannot have duplicate results in the same category and run'
);

select throws_ok(
  $$insert into public.shoe_retailer_links (id, shoe_id, retailer_id, affiliate_url, active, is_primary) values ('10000000-0000-0000-0000-000000000032', '10000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000021', 'https://integrity.example/two', true, true)$$,
  '23505',
  null,
  'a shoe can have only one active primary retailer link'
);

update public.ranking_runs
set status = 'published', published_at = now()
where id = '10000000-0000-0000-0000-000000000051';

select throws_ok(
  $$update public.ranking_runs set notes = 'changed' where id = '10000000-0000-0000-0000-000000000051'$$,
  'P0001',
  'Published ranking runs are immutable',
  'published ranking runs cannot be updated'
);

select throws_ok(
  $$delete from public.ranking_runs where id = '10000000-0000-0000-0000-000000000051'$$,
  'P0001',
  'Published ranking runs are immutable',
  'published ranking runs cannot be deleted'
);

select throws_ok(
  $$update public.ranking_results set score = 89 where id = '10000000-0000-0000-0000-000000000061'$$,
  'P0001',
  'Results in published ranking runs are immutable',
  'published ranking results cannot be updated'
);

select throws_ok(
  $$delete from public.ranking_results where id = '10000000-0000-0000-0000-000000000061'$$,
  'P0001',
  'Results in published ranking runs are immutable',
  'published ranking results cannot be deleted'
);

insert into public.shoe_metrics (id, shoe_id, metric_key, value, data_source, effective_date, metric_version, is_public)
values ('10000000-0000-0000-0000-000000000071', '10000000-0000-0000-0000-000000000011', 'durability', 8, 'editorial', '2026-09-01', 'v1', true);

select throws_ok(
  $$update public.shoe_metrics set value = 9 where id = '10000000-0000-0000-0000-000000000071'$$,
  'P0001',
  'Public shoe metric rows are immutable',
  'public metric observations cannot be updated'
);

select throws_ok(
  $$delete from public.shoe_metrics where id = '10000000-0000-0000-0000-000000000071'$$,
  'P0001',
  'Public shoe metric rows are immutable',
  'public metric observations cannot be deleted'
);

select * from finish();
rollback;
