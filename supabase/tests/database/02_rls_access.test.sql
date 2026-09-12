begin;

-- Linked CLI tests use a temporary login that cannot access the extensions
-- schema directly. Step down to postgres inside this rollback-only transaction.
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public;

select plan(16);

insert into public.brands (id, name, slug)
values
  ('00000000-0000-0000-0000-000000000001', 'Public Brand', 'public-brand'),
  ('00000000-0000-0000-0000-000000000002', 'Private Brand', 'private-brand');

insert into public.shoes (id, brand_id, model_name, slug, status, spec_verification_status, spec_verified_at, is_public)
values
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Public Shoe', 'public-shoe', 'active', 'source_checked', '2026-09-01', true),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000002', 'Private Shoe', 'private-shoe', 'active', 'unverified', null, false);

insert into public.retailers (id, name, slug, homepage_url, active)
values
  ('00000000-0000-0000-0000-000000000021', 'Active Retailer', 'active-retailer', 'https://retailer.example', true),
  ('00000000-0000-0000-0000-000000000022', 'Inactive Retailer', 'inactive-retailer', 'https://inactive.example', false);

insert into public.shoe_retailer_links (id, shoe_id, retailer_id, affiliate_url, active, is_primary)
values
  ('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000021', 'https://retailer.example/public', true, true),
  ('00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000021', 'https://retailer.example/inactive', false, false),
  ('00000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000022', 'https://inactive.example/hidden', true, false);

insert into public.ranking_categories (id, name, slug, active)
values
  ('00000000-0000-0000-0000-000000000041', 'Active Category', 'active-category', true),
  ('00000000-0000-0000-0000-000000000042', 'Inactive Category', 'inactive-category', false);

insert into public.ranking_runs (id, name, effective_date, methodology_version)
values
  ('00000000-0000-0000-0000-000000000051', 'Published Run', '2026-09-01', 'v1'),
  ('00000000-0000-0000-0000-000000000052', 'Draft Run', '2026-10-01', 'v1');

insert into public.ranking_results (id, ranking_run_id, ranking_category_id, shoe_id, score, rank)
values
  ('00000000-0000-0000-0000-000000000061', '00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000011', 90, 1),
  ('00000000-0000-0000-0000-000000000062', '00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000011', 80, 2),
  ('00000000-0000-0000-0000-000000000063', '00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000012', 70, 3),
  ('00000000-0000-0000-0000-000000000064', '00000000-0000-0000-0000-000000000052', '00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000011', 85, 1);

update public.ranking_runs
set status = 'published', published_at = now()
where id = '00000000-0000-0000-0000-000000000051';

insert into public.shoe_metrics (id, shoe_id, metric_key, value, normalized_value, data_source, effective_date, metric_version, verification_status, is_public)
values
  ('00000000-0000-0000-0000-000000000071', '00000000-0000-0000-0000-000000000011', 'cushioning', 8.5, 85, 'editorial', '2026-09-01', 'v1', 'source_checked', true),
  ('00000000-0000-0000-0000-000000000072', '00000000-0000-0000-0000-000000000011', 'stability', 7.5, 75, 'editorial', '2026-09-01', 'v1', 'unverified', false),
  ('00000000-0000-0000-0000-000000000073', '00000000-0000-0000-0000-000000000012', 'cushioning', 8, 80, 'editorial', '2026-09-01', 'v1', 'source_checked', true);

set local role anon;
select is((select count(*) from public.brands where id between '00000000-0000-0000-0000-000000000001' and '00000000-0000-0000-0000-000000000002'), 1::bigint, 'anon sees brands with public shoes only');
select is((select count(*) from public.shoes where id between '00000000-0000-0000-0000-000000000011' and '00000000-0000-0000-0000-000000000012'), 1::bigint, 'anon sees public shoes only');
select is((select count(*) from public.retailers where id between '00000000-0000-0000-0000-000000000021' and '00000000-0000-0000-0000-000000000022'), 1::bigint, 'anon sees active retailers only');
select is((select count(*) from public.shoe_retailer_links where id between '00000000-0000-0000-0000-000000000031' and '00000000-0000-0000-0000-000000000033'), 1::bigint, 'anon sees active links for public shoes and retailers only');
select is((select count(*) from public.ranking_categories where id between '00000000-0000-0000-0000-000000000041' and '00000000-0000-0000-0000-000000000042'), 1::bigint, 'anon sees active categories only');
select is((select count(*) from public.ranking_runs where id between '00000000-0000-0000-0000-000000000051' and '00000000-0000-0000-0000-000000000052'), 1::bigint, 'anon sees published runs only');
select is((select count(*) from public.ranking_results where id between '00000000-0000-0000-0000-000000000061' and '00000000-0000-0000-0000-000000000064'), 1::bigint, 'anon sees results whose full publication chain is public');
select is((select count(*) from public.shoe_metrics where id between '00000000-0000-0000-0000-000000000071' and '00000000-0000-0000-0000-000000000073'), 1::bigint, 'anon sees public metrics for public shoes only');

set local role postgres;
set local role authenticated;
select is((select count(*) from public.brands where id between '00000000-0000-0000-0000-000000000001' and '00000000-0000-0000-0000-000000000002'), 1::bigint, 'authenticated public access sees brands with public shoes only');
select is((select count(*) from public.shoes where id between '00000000-0000-0000-0000-000000000011' and '00000000-0000-0000-0000-000000000012'), 1::bigint, 'authenticated public access sees public shoes only');
select is((select count(*) from public.retailers where id between '00000000-0000-0000-0000-000000000021' and '00000000-0000-0000-0000-000000000022'), 1::bigint, 'authenticated public access sees active retailers only');
select is((select count(*) from public.shoe_retailer_links where id between '00000000-0000-0000-0000-000000000031' and '00000000-0000-0000-0000-000000000033'), 1::bigint, 'authenticated public access sees active public links only');
select is((select count(*) from public.ranking_categories where id between '00000000-0000-0000-0000-000000000041' and '00000000-0000-0000-0000-000000000042'), 1::bigint, 'authenticated public access sees active categories only');
select is((select count(*) from public.ranking_runs where id between '00000000-0000-0000-0000-000000000051' and '00000000-0000-0000-0000-000000000052'), 1::bigint, 'authenticated public access sees published runs only');
select is((select count(*) from public.ranking_results where id between '00000000-0000-0000-0000-000000000061' and '00000000-0000-0000-0000-000000000064'), 1::bigint, 'authenticated public access sees fully public results only');
select is((select count(*) from public.shoe_metrics where id between '00000000-0000-0000-0000-000000000071' and '00000000-0000-0000-0000-000000000073'), 1::bigint, 'authenticated public access sees public metrics only');

set local role postgres;
select * from finish();
rollback;
