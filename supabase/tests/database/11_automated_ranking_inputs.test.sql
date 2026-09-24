begin;

set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public;

select plan(21);

select has_table('public', 'shoe_review_observations', 'review observation table exists');
select has_table('public', 'shoe_ranking_inputs', 'ranking input table exists');
select has_table('public', 'shoe_ranking_category_eligibility', 'category eligibility table exists');
select has_fk('public', 'shoe_ranking_category_eligibility', 'eligibility is tied to a reviewed input version');
select has_function('public', 'import_ranking_review_observations', array['jsonb'], 'review import function exists');
select has_function('public', 'import_shoe_ranking_inputs', array['jsonb'], 'ranking input import function exists');
select ok(not has_function_privilege('anon', 'public.import_ranking_review_observations(jsonb)', 'EXECUTE'), 'anon cannot import reviews');
select ok(not has_function_privilege('authenticated', 'public.import_shoe_ranking_inputs(jsonb)', 'EXECUTE'), 'ordinary authenticated users cannot import ranking inputs');
select ok(not has_table_privilege('anon', 'public.shoe_review_observations', 'SELECT'), 'anon cannot read review observations');
select ok(not has_table_privilege('anon', 'public.shoe_ranking_inputs', 'SELECT'), 'anon cannot read ranking inputs');
select ok(not has_table_privilege('anon', 'public.shoe_ranking_category_eligibility', 'SELECT'), 'anon cannot read eligibility');
select is((select count(*)::integer from public.ranking_categories where slug in (
  'neutral-road', 'stability-road', 'race-road', 'light-trail-hybrid', 'technical-trail',
  'cross-country-spikes', 'distance-spikes', 'daily-trainers', 'long-distance-road',
  'lightweight-trainers', 'speed-trainers', 'motion-control-road', 'wide-fit-road',
  'budget-road', 'premium-road', 'distance-trail', 'racing-trail', 'cushion-trail',
  'waterproof-trail', 'racing-flats-road', 'mid-distance-spikes', 'sprint-spikes'
)), 22, 'all approved categories are registered');

insert into public.brands (id, name, slug)
values ('14000000-0000-0000-0000-000000000001', 'Ranking Engine Test Brand', 'ranking-engine-test-brand');
insert into public.shoes (id, brand_id, model_name, slug, status, spec_verification_status, is_public)
values ('14000000-0000-0000-0000-000000000011', '14000000-0000-0000-0000-000000000001', 'Ranking Engine Test Shoe', 'ranking-engine-test-shoe', 'active', 'source_checked', false);

select is(
  (public.import_ranking_review_observations(
    '[{"shoe_slug":"ranking-engine-test-shoe","source_key":"running-warehouse","rating":4.5,"review_count":100,"product_url":"https://example.test/shoe","observed_at":"2026-09-23","verification_status":"source_checked","notes":null}]'::jsonb
  )->>'processed_rows')::integer,
  1,
  'review observation imports transactionally'
);
select is((select count(*)::integer from public.shoe_review_observations where shoe_id = '14000000-0000-0000-0000-000000000011'), 1, 'one review observation is stored');

select lives_ok(
  $$select public.import_ranking_review_observations(
    '[{"shoe_slug":"ranking-engine-test-shoe","source_key":"running-warehouse","rating":4.6,"review_count":120,"product_url":"https://example.test/shoe","observed_at":"2026-09-23","verification_status":"cross_checked","notes":"updated"}]'::jsonb
  )$$,
  'repeat review import safely updates the same observation'
);
select is((select review_count from public.shoe_review_observations where shoe_id = '14000000-0000-0000-0000-000000000011'), 120, 'repeat review import updates values without a duplicate');

select is(
  (public.import_shoe_ranking_inputs(
    '[{"shoe_slug":"ranking-engine-test-shoe","methodology_version":"overall-score-v1","effective_date":"2026-09-23","fit_classification":"great","cushion_classification":"balanced","category_slugs":["neutral-road","daily-trainers"],"reviewed_at":"2026-09-23","notes":null}]'::jsonb
  )->>'processed_inputs')::integer,
  1,
  'ranking input imports transactionally'
);
select is((select count(*)::integer from public.shoe_ranking_inputs where shoe_id = '14000000-0000-0000-0000-000000000011'), 1, 'one versioned ranking input is stored');
select is((select count(*)::integer from public.shoe_ranking_category_eligibility where shoe_id = '14000000-0000-0000-0000-000000000011'), 2, 'category eligibility is stored as relationships');

select lives_ok(
  $$select public.import_shoe_ranking_inputs(
    '[{"shoe_slug":"ranking-engine-test-shoe","methodology_version":"overall-score-v1","effective_date":"2026-09-23","fit_classification":"great","cushion_classification":"plush","category_slugs":["daily-trainers"],"reviewed_at":"2026-09-24","notes":"reviewed"}]'::jsonb
  )$$,
  'repeat ranking input import updates and resynchronizes eligibility'
);
select is((select count(*)::integer from public.shoe_ranking_category_eligibility where shoe_id = '14000000-0000-0000-0000-000000000011'), 1, 'removed eligibility does not linger after repeat import');

select * from finish();
rollback;
