begin;

set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public;

select plan(18);

select has_column('public', 'shoes', 'weight_reference_size', 'shoes preserve the listed weight reference size');
select has_column('public', 'shoes', 'weight_reference_category', 'shoes preserve the listed weight reference category');

select ok(
  exists (
    select 1
    from pg_constraint
    where conrelid = constraint_spec.table_name::regclass
      and conname = constraint_spec.constraint_name
      and contype = 'c'
  ),
  format('%s exists', constraint_spec.constraint_name)
)
from (
  values
    ('public.shoes', 'shoes_primary_surface_v1_allowed'),
    ('public.shoes', 'shoes_support_category_v1_allowed'),
    ('public.shoes', 'shoes_weight_reference_v1_complete'),
    ('public.shoes', 'shoes_weight_v1_has_reference'),
    ('public.shoes', 'shoes_public_requires_verified_specification_v1'),
    ('public.shoe_metrics', 'shoe_metrics_v1_score_range'),
    ('public.shoe_metrics', 'shoe_metrics_v1_key_kind')
) as constraint_spec(table_name, constraint_name);

insert into public.brands (id, name, slug)
values ('18000000-0000-0000-0000-000000000001', 'Vocabulary Test Brand', 'vocabulary-test-brand');

insert into public.shoes (
  id, brand_id, model_name, slug, status, is_public,
  primary_surface, support_category, weight_oz,
  weight_reference_size, weight_reference_category, available_widths
)
values (
  '18000000-0000-0000-0000-000000000011',
  '18000000-0000-0000-0000-000000000001',
  'Vocabulary Test Shoe',
  'vocabulary-test-shoe',
  'active',
  false,
  'hybrid',
  'neutral',
  8.5,
  'US 9',
  'men',
  array['B', 'D', '2E', '4E']::text[]
);

select throws_ok(
  $$insert into public.shoes (id, brand_id, model_name, slug, primary_surface) values ('18000000-0000-0000-0000-000000000012', '18000000-0000-0000-0000-000000000001', 'Bad Surface', 'bad-surface', 'treadmill')$$,
  '23514',
  null,
  'the database rejects a surface outside the v1 vocabulary'
);

select throws_ok(
  $$insert into public.shoes (id, brand_id, model_name, slug, support_category) values ('18000000-0000-0000-0000-000000000013', '18000000-0000-0000-0000-000000000001', 'Bad Support', 'bad-support', 'guided')$$,
  '23514',
  null,
  'the database rejects a support category outside the v1 vocabulary'
);

select throws_ok(
  $$insert into public.shoe_metrics (shoe_id, metric_key, metric_kind, value, unit, data_source, effective_date, metric_version) values ('18000000-0000-0000-0000-000000000011', 'comfort', 'evaluative', 101, 'score_0_100', 'pgTAP', '2026-09-01', 'metric-v1:test')$$,
  '23514',
  null,
  'the database rejects a v1 score above 100'
);

select throws_ok(
  $$insert into public.shoe_metrics (shoe_id, metric_key, metric_kind, value, unit, data_source, effective_date, metric_version) values ('18000000-0000-0000-0000-000000000011', 'daily_training', 'evaluative', 50, 'score_0_100', 'pgTAP', '2026-09-01', 'metric-v1:test')$$,
  '23514',
  null,
  'the database rejects a metric key paired with the wrong kind'
);

select is(
  (select count(*) from public.shoe_metrics where shoe_id = '18000000-0000-0000-0000-000000000011'),
  0::bigint,
  'a shoe with unassessed metrics has no fabricated metric rows'
);

select is(
  (select available_widths from public.shoes where id = '18000000-0000-0000-0000-000000000011'),
  array['B', 'D', '2E', '4E']::text[],
  'manufacturer width codes remain distinct'
);

select is(
  (select weight_reference_size from public.shoes where id = '18000000-0000-0000-0000-000000000011'),
  'US 9',
  'weight reference size is preserved'
);

select is(
  (select weight_reference_category from public.shoes where id = '18000000-0000-0000-0000-000000000011'),
  'men',
  'weight reference category is preserved'
);

select throws_ok(
  $$insert into public.shoes (id, brand_id, model_name, slug, status, is_public) values ('18000000-0000-0000-0000-000000000014', '18000000-0000-0000-0000-000000000001', 'Unverified Public Shoe', 'unverified-public-shoe', 'active', true)$$,
  '23514',
  null,
  'the database rejects a real public shoe before specification verification'
);

select * from finish();
rollback;

