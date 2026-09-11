-- =============================================================================
-- DEVELOPMENT/DEMO DATA ONLY
--
-- These fictional records exist solely for local and explicitly approved
-- linked-development testing. They are not product claims, official rankings,
-- real retailers, or real affiliate relationships. Reserved .example domains
-- ensure that none of the retailer URLs can be mistaken for live destinations.
-- =============================================================================

-- One anonymous block is one atomic statement. This lets the same file run
-- during `db reset` and through `supabase db query --file`.
do $development_demo_seed$
begin
  perform set_config('lock_timeout', '5s', true);
  perform set_config('statement_timeout', '60s', true);

  -- Refuse to reuse this seed's deterministic IDs if they belong to non-demo data.
  if exists (
    select 1
    from public.brands
    where id = any (array[
      'de000000-0000-4000-8000-000000000001'::uuid,
      'de000000-0000-4000-8000-000000000002'::uuid,
      'de000000-0000-4000-8000-000000000003'::uuid
    ])
      and name not like 'DEVELOPMENT DEMO:%'
  ) or exists (
    select 1
    from public.shoes
    where id between 'de000000-0000-4000-8000-000000000101'::uuid
      and 'de000000-0000-4000-8000-000000000106'::uuid
      and not (metadata @> '{"development_demo": true}'::jsonb)
  ) or exists (
    select 1
    from public.retailers
    where id = any (array[
      'de000000-0000-4000-8000-000000000201'::uuid,
      'de000000-0000-4000-8000-000000000202'::uuid,
      'de000000-0000-4000-8000-000000000203'::uuid
    ])
      and name not like 'DEVELOPMENT DEMO:%'
  ) or exists (
    select 1
    from public.ranking_categories
    where id = any (array[
      'de000000-0000-4000-8000-000000000401'::uuid,
      'de000000-0000-4000-8000-000000000402'::uuid
    ])
      and name not like 'DEVELOPMENT DEMO:%'
  ) or exists (
    select 1
    from public.ranking_runs
    where id = any (array[
      'de000000-0000-4000-8000-000000000501'::uuid,
      'de000000-0000-4000-8000-000000000502'::uuid
    ])
      and (notes is null or notes not like 'DEVELOPMENT/DEMO:%')
  ) then
    raise exception 'Demo seed ID collision detected; no seed data was written';
  end if;

  insert into public.brands (id, name, slug, website_url)
  values
  ('de000000-0000-4000-8000-000000000001', 'DEVELOPMENT DEMO: Northstar Running', 'demo-northstar-running', 'https://northstar-running.example'),
  ('de000000-0000-4000-8000-000000000002', 'DEVELOPMENT DEMO: Meridian Athletics', 'demo-meridian-athletics', 'https://meridian-athletics.example'),
  ('de000000-0000-4000-8000-000000000003', 'DEVELOPMENT DEMO: Forge Footwear', 'demo-forge-footwear', 'https://forge-footwear.example')
  on conflict (id) do nothing;

  insert into public.shoes (
  id,
  brand_id,
  model_name,
  slug,
  model_version,
  model_year,
  status,
  gender,
  is_public,
  msrp,
  currency,
  short_description,
  full_description,
  release_date,
  specs,
  metadata
)
values
  (
    'de000000-0000-4000-8000-000000000101',
    'de000000-0000-4000-8000-000000000001',
    'DEMO Aero Day 2',
    'demo-aero-day-2',
    '2',
    2026,
    'active',
    'unisex',
    true,
    140.00,
    'USD',
    'DEVELOPMENT/DEMO: A balanced fictional daily trainer fixture.',
    'DEVELOPMENT/DEMO DATA ONLY. This description is not a review or product claim.',
    '2026-02-01',
    '{"weight_oz": 8.6, "heel_to_toe_drop_mm": 8, "stack_height_mm": 34, "surface": "road"}',
    '{"development_demo": true, "seed_version": "phase-7-v1"}'
  ),
  (
    'de000000-0000-4000-8000-000000000102',
    'de000000-0000-4000-8000-000000000001',
    'DEMO Summit Cushion',
    'demo-summit-cushion',
    '1',
    2026,
    'active',
    'unisex',
    true,
    160.00,
    'USD',
    'DEVELOPMENT/DEMO: A high-cushion fictional road shoe fixture.',
    'DEVELOPMENT/DEMO DATA ONLY. This description is not a review or product claim.',
    '2026-03-15',
    '{"weight_oz": 9.8, "heel_to_toe_drop_mm": 6, "stack_height_mm": 40, "surface": "road"}',
    '{"development_demo": true, "seed_version": "phase-7-v1"}'
  ),
  (
    'de000000-0000-4000-8000-000000000103',
    'de000000-0000-4000-8000-000000000002',
    'DEMO Relay Tempo',
    'demo-relay-tempo',
    '1',
    2026,
    'active',
    'unisex',
    true,
    150.00,
    'USD',
    'DEVELOPMENT/DEMO: A lightweight fictional uptempo shoe fixture.',
    'DEVELOPMENT/DEMO DATA ONLY. This description is not a review or product claim.',
    '2026-01-20',
    '{"weight_oz": 7.4, "heel_to_toe_drop_mm": 8, "stack_height_mm": 32, "surface": "road"}',
    '{"development_demo": true, "seed_version": "phase-7-v1"}'
  ),
  (
    'de000000-0000-4000-8000-000000000104',
    'de000000-0000-4000-8000-000000000002',
    'DEMO Guide Support',
    'demo-guide-support',
    '1',
    2026,
    'active',
    'unisex',
    true,
    145.00,
    'USD',
    'DEVELOPMENT/DEMO: A stable fictional everyday shoe fixture.',
    'DEVELOPMENT/DEMO DATA ONLY. This description is not a review or product claim.',
    '2026-04-05',
    '{"weight_oz": 10.2, "heel_to_toe_drop_mm": 10, "stack_height_mm": 36, "surface": "road", "support": "stability"}',
    '{"development_demo": true, "seed_version": "phase-7-v1"}'
  ),
  (
    'de000000-0000-4000-8000-000000000105',
    'de000000-0000-4000-8000-000000000003',
    'DEMO Horizon Long Run',
    'demo-horizon-long-run',
    '1',
    2026,
    'active',
    'unisex',
    true,
    170.00,
    'USD',
    'DEVELOPMENT/DEMO: A protective fictional long-run shoe fixture.',
    'DEVELOPMENT/DEMO DATA ONLY. This description is not a review or product claim.',
    '2026-05-10',
    '{"weight_oz": 9.4, "heel_to_toe_drop_mm": 8, "stack_height_mm": 38, "surface": "road"}',
    '{"development_demo": true, "seed_version": "phase-7-v1"}'
  ),
  (
    'de000000-0000-4000-8000-000000000106',
    'de000000-0000-4000-8000-000000000003',
    'DEMO Pace Value',
    'demo-pace-value',
    '1',
    2026,
    'active',
    'unisex',
    true,
    110.00,
    'USD',
    'DEVELOPMENT/DEMO: A versatile fictional value shoe fixture.',
    'DEVELOPMENT/DEMO DATA ONLY. This description is not a review or product claim.',
    '2026-06-01',
    '{"weight_oz": 8.9, "heel_to_toe_drop_mm": 8, "stack_height_mm": 33, "surface": "road"}',
    '{"development_demo": true, "seed_version": "phase-7-v1"}'
  )
  on conflict (id) do nothing;

  insert into public.retailers (id, name, slug, homepage_url, active)
  values
  ('de000000-0000-4000-8000-000000000201', 'DEVELOPMENT DEMO: Fleet Lab', 'demo-fleet-lab', 'https://demo-fleet.example', true),
  ('de000000-0000-4000-8000-000000000202', 'DEVELOPMENT DEMO: Run Supply', 'demo-run-supply', 'https://demo-run-supply.example', true),
  ('de000000-0000-4000-8000-000000000203', 'DEVELOPMENT DEMO: Pace Market', 'demo-pace-market', 'https://demo-pace-market.example', true)
  on conflict (id) do nothing;

  insert into public.shoe_retailer_links (
  id, shoe_id, retailer_id, affiliate_url, regular_url, displayed_price,
  currency, is_primary, active, last_verified_at
)
values
  ('de000000-0000-4000-8000-000000000301', 'de000000-0000-4000-8000-000000000101', 'de000000-0000-4000-8000-000000000201', 'https://demo-fleet.example/demo-shoes/demo-aero-day-2', 'https://demo-fleet.example/catalog/demo-aero-day-2', 139.99, 'USD', true, true, '2026-09-01 12:00:00+00'),
  ('de000000-0000-4000-8000-000000000302', 'de000000-0000-4000-8000-000000000101', 'de000000-0000-4000-8000-000000000202', 'https://demo-run-supply.example/demo-shoes/demo-aero-day-2', 'https://demo-run-supply.example/catalog/demo-aero-day-2', 136.00, 'USD', false, true, '2026-09-01 12:00:00+00'),
  ('de000000-0000-4000-8000-000000000303', 'de000000-0000-4000-8000-000000000102', 'de000000-0000-4000-8000-000000000202', 'https://demo-run-supply.example/demo-shoes/demo-summit-cushion', 'https://demo-run-supply.example/catalog/demo-summit-cushion', 159.99, 'USD', true, true, '2026-09-01 12:00:00+00'),
  ('de000000-0000-4000-8000-000000000304', 'de000000-0000-4000-8000-000000000102', 'de000000-0000-4000-8000-000000000203', 'https://demo-pace-market.example/demo-shoes/demo-summit-cushion', 'https://demo-pace-market.example/catalog/demo-summit-cushion', 155.00, 'USD', false, true, '2026-09-01 12:00:00+00'),
  ('de000000-0000-4000-8000-000000000305', 'de000000-0000-4000-8000-000000000103', 'de000000-0000-4000-8000-000000000201', 'https://demo-fleet.example/demo-shoes/demo-relay-tempo', 'https://demo-fleet.example/catalog/demo-relay-tempo', 149.99, 'USD', true, true, '2026-09-01 12:00:00+00'),
  ('de000000-0000-4000-8000-000000000306', 'de000000-0000-4000-8000-000000000103', 'de000000-0000-4000-8000-000000000203', 'https://demo-pace-market.example/demo-shoes/demo-relay-tempo', 'https://demo-pace-market.example/catalog/demo-relay-tempo', 147.00, 'USD', false, true, '2026-09-01 12:00:00+00'),
  ('de000000-0000-4000-8000-000000000307', 'de000000-0000-4000-8000-000000000104', 'de000000-0000-4000-8000-000000000202', 'https://demo-run-supply.example/demo-shoes/demo-guide-support', 'https://demo-run-supply.example/catalog/demo-guide-support', 144.99, 'USD', true, true, '2026-09-01 12:00:00+00'),
  ('de000000-0000-4000-8000-000000000308', 'de000000-0000-4000-8000-000000000104', 'de000000-0000-4000-8000-000000000201', 'https://demo-fleet.example/demo-shoes/demo-guide-support', 'https://demo-fleet.example/catalog/demo-guide-support', 142.00, 'USD', false, true, '2026-09-01 12:00:00+00'),
  ('de000000-0000-4000-8000-000000000309', 'de000000-0000-4000-8000-000000000105', 'de000000-0000-4000-8000-000000000203', 'https://demo-pace-market.example/demo-shoes/demo-horizon-long-run', 'https://demo-pace-market.example/catalog/demo-horizon-long-run', 169.99, 'USD', true, true, '2026-09-01 12:00:00+00'),
  ('de000000-0000-4000-8000-000000000310', 'de000000-0000-4000-8000-000000000105', 'de000000-0000-4000-8000-000000000202', 'https://demo-run-supply.example/demo-shoes/demo-horizon-long-run', 'https://demo-run-supply.example/catalog/demo-horizon-long-run', 165.00, 'USD', false, true, '2026-09-01 12:00:00+00'),
  ('de000000-0000-4000-8000-000000000311', 'de000000-0000-4000-8000-000000000106', 'de000000-0000-4000-8000-000000000201', 'https://demo-fleet.example/demo-shoes/demo-pace-value', 'https://demo-fleet.example/catalog/demo-pace-value', 109.99, 'USD', true, true, '2026-09-01 12:00:00+00'),
  ('de000000-0000-4000-8000-000000000312', 'de000000-0000-4000-8000-000000000106', 'de000000-0000-4000-8000-000000000203', 'https://demo-pace-market.example/demo-shoes/demo-pace-value', 'https://demo-pace-market.example/catalog/demo-pace-value', 105.00, 'USD', false, true, '2026-09-01 12:00:00+00')
  on conflict (id) do nothing;

  insert into public.ranking_categories (id, name, slug, description, active)
  values
  ('de000000-0000-4000-8000-000000000401', 'DEVELOPMENT DEMO: Daily Trainers', 'demo-daily-trainers', 'DEVELOPMENT/DEMO category used to exercise ranking pages.', true),
  ('de000000-0000-4000-8000-000000000402', 'DEVELOPMENT DEMO: Cushioned Shoes', 'demo-cushioned-shoes', 'DEVELOPMENT/DEMO category used to exercise ranking history.', true)
  on conflict (id) do nothing;

  insert into public.ranking_runs (
  id, name, effective_date, methodology_version, notes, status, published_at
)
values
  ('de000000-0000-4000-8000-000000000501', 'DEVELOPMENT DEMO: August 2026', '2026-08-01', 'demo-v1', 'DEVELOPMENT/DEMO: Fictional snapshot; not an official ranking.', 'draft', null),
  ('de000000-0000-4000-8000-000000000502', 'DEVELOPMENT DEMO: September 2026', '2026-09-01', 'demo-v1', 'DEVELOPMENT/DEMO: Fictional snapshot; not an official ranking.', 'draft', null)
  on conflict (id) do nothing;

  insert into public.ranking_results (
  id, ranking_run_id, ranking_category_id, shoe_id, score, rank,
  component_scores, metadata
)
select
  seed.id,
  seed.ranking_run_id,
  seed.ranking_category_id,
  seed.shoe_id,
  seed.score,
  seed.rank,
  seed.component_scores,
  seed.metadata
from (
  values
    ('de000000-0000-4000-8000-000000000601'::uuid, 'de000000-0000-4000-8000-000000000501'::uuid, 'de000000-0000-4000-8000-000000000401'::uuid, 'de000000-0000-4000-8000-000000000101'::uuid, 87.0::numeric, 1, '{"fit": 86, "ride": 88, "value": 87}'::jsonb, '{"development_demo": true}'::jsonb),
    ('de000000-0000-4000-8000-000000000602'::uuid, 'de000000-0000-4000-8000-000000000501'::uuid, 'de000000-0000-4000-8000-000000000401'::uuid, 'de000000-0000-4000-8000-000000000103'::uuid, 84.0::numeric, 2, '{"fit": 82, "ride": 90, "value": 80}'::jsonb, '{"development_demo": true}'::jsonb),
    ('de000000-0000-4000-8000-000000000603'::uuid, 'de000000-0000-4000-8000-000000000501'::uuid, 'de000000-0000-4000-8000-000000000401'::uuid, 'de000000-0000-4000-8000-000000000106'::uuid, 81.0::numeric, 3, '{"fit": 80, "ride": 76, "value": 92}'::jsonb, '{"development_demo": true}'::jsonb),
    ('de000000-0000-4000-8000-000000000604'::uuid, 'de000000-0000-4000-8000-000000000501'::uuid, 'de000000-0000-4000-8000-000000000402'::uuid, 'de000000-0000-4000-8000-000000000102'::uuid, 90.0::numeric, 1, '{"comfort": 94, "protection": 92, "value": 76}'::jsonb, '{"development_demo": true}'::jsonb),
    ('de000000-0000-4000-8000-000000000605'::uuid, 'de000000-0000-4000-8000-000000000501'::uuid, 'de000000-0000-4000-8000-000000000402'::uuid, 'de000000-0000-4000-8000-000000000105'::uuid, 88.0::numeric, 2, '{"comfort": 91, "protection": 90, "value": 72}'::jsonb, '{"development_demo": true}'::jsonb),
    ('de000000-0000-4000-8000-000000000606'::uuid, 'de000000-0000-4000-8000-000000000501'::uuid, 'de000000-0000-4000-8000-000000000402'::uuid, 'de000000-0000-4000-8000-000000000104'::uuid, 83.0::numeric, 3, '{"comfort": 84, "protection": 88, "value": 78}'::jsonb, '{"development_demo": true}'::jsonb),
    ('de000000-0000-4000-8000-000000000607'::uuid, 'de000000-0000-4000-8000-000000000502'::uuid, 'de000000-0000-4000-8000-000000000401'::uuid, 'de000000-0000-4000-8000-000000000103'::uuid, 89.0::numeric, 1, '{"fit": 84, "ride": 94, "value": 83}'::jsonb, '{"development_demo": true}'::jsonb),
    ('de000000-0000-4000-8000-000000000608'::uuid, 'de000000-0000-4000-8000-000000000502'::uuid, 'de000000-0000-4000-8000-000000000401'::uuid, 'de000000-0000-4000-8000-000000000101'::uuid, 86.5::numeric, 2, '{"fit": 87, "ride": 87, "value": 85}'::jsonb, '{"development_demo": true}'::jsonb),
    ('de000000-0000-4000-8000-000000000609'::uuid, 'de000000-0000-4000-8000-000000000502'::uuid, 'de000000-0000-4000-8000-000000000401'::uuid, 'de000000-0000-4000-8000-000000000106'::uuid, 82.0::numeric, 3, '{"fit": 81, "ride": 77, "value": 93}'::jsonb, '{"development_demo": true}'::jsonb),
    ('de000000-0000-4000-8000-000000000610'::uuid, 'de000000-0000-4000-8000-000000000502'::uuid, 'de000000-0000-4000-8000-000000000402'::uuid, 'de000000-0000-4000-8000-000000000105'::uuid, 91.0::numeric, 1, '{"comfort": 93, "protection": 92, "value": 73}'::jsonb, '{"development_demo": true}'::jsonb),
    ('de000000-0000-4000-8000-000000000611'::uuid, 'de000000-0000-4000-8000-000000000502'::uuid, 'de000000-0000-4000-8000-000000000402'::uuid, 'de000000-0000-4000-8000-000000000102'::uuid, 89.0::numeric, 2, '{"comfort": 95, "protection": 91, "value": 75}'::jsonb, '{"development_demo": true}'::jsonb),
    ('de000000-0000-4000-8000-000000000612'::uuid, 'de000000-0000-4000-8000-000000000502'::uuid, 'de000000-0000-4000-8000-000000000402'::uuid, 'de000000-0000-4000-8000-000000000104'::uuid, 84.0::numeric, 3, '{"comfort": 85, "protection": 89, "value": 79}'::jsonb, '{"development_demo": true}'::jsonb)
) as seed(id, ranking_run_id, ranking_category_id, shoe_id, score, rank, component_scores, metadata)
where not exists (
  select 1
  from public.ranking_results as existing
  where existing.ranking_run_id = seed.ranking_run_id
    and existing.ranking_category_id = seed.ranking_category_id
    and existing.shoe_id = seed.shoe_id
);

  insert into public.shoe_metrics (
  id, shoe_id, metric_key, value, normalized_value, unit, data_source,
  source_reference, effective_date, metric_version, confidence, notes, is_public
)
values
  ('de000000-0000-4000-8000-000000000701', 'de000000-0000-4000-8000-000000000101', 'cushioning', 7.8, 78, 'demo_1_to_10', 'DEVELOPMENT/DEMO fixture', null, '2026-09-01', 'demo-v1', 0.5000, 'Fictional metric for development only.', true),
  ('de000000-0000-4000-8000-000000000702', 'de000000-0000-4000-8000-000000000101', 'stability', 6.5, 65, 'demo_1_to_10', 'DEVELOPMENT/DEMO fixture', null, '2026-09-01', 'demo-v1', 0.5000, 'Fictional metric for development only.', true),
  ('de000000-0000-4000-8000-000000000703', 'de000000-0000-4000-8000-000000000101', 'responsiveness', 8.2, 82, 'demo_1_to_10', 'DEVELOPMENT/DEMO fixture', null, '2026-09-01', 'demo-v1', 0.5000, 'Fictional metric for development only.', true),
  ('de000000-0000-4000-8000-000000000704', 'de000000-0000-4000-8000-000000000101', 'value', 8.0, 80, 'demo_1_to_10', 'DEVELOPMENT/DEMO fixture', null, '2026-09-01', 'demo-v1', 0.5000, 'Fictional metric for development only.', true),
  ('de000000-0000-4000-8000-000000000705', 'de000000-0000-4000-8000-000000000102', 'cushioning', 9.5, 95, 'demo_1_to_10', 'DEVELOPMENT/DEMO fixture', null, '2026-09-01', 'demo-v1', 0.5000, 'Fictional metric for development only.', true),
  ('de000000-0000-4000-8000-000000000706', 'de000000-0000-4000-8000-000000000102', 'stability', 6.0, 60, 'demo_1_to_10', 'DEVELOPMENT/DEMO fixture', null, '2026-09-01', 'demo-v1', 0.5000, 'Fictional metric for development only.', true),
  ('de000000-0000-4000-8000-000000000707', 'de000000-0000-4000-8000-000000000102', 'responsiveness', 7.2, 72, 'demo_1_to_10', 'DEVELOPMENT/DEMO fixture', null, '2026-09-01', 'demo-v1', 0.5000, 'Fictional metric for development only.', true),
  ('de000000-0000-4000-8000-000000000708', 'de000000-0000-4000-8000-000000000102', 'value', 6.8, 68, 'demo_1_to_10', 'DEVELOPMENT/DEMO fixture', null, '2026-09-01', 'demo-v1', 0.5000, 'Fictional metric for development only.', true),
  ('de000000-0000-4000-8000-000000000709', 'de000000-0000-4000-8000-000000000103', 'cushioning', 7.2, 72, 'demo_1_to_10', 'DEVELOPMENT/DEMO fixture', null, '2026-09-01', 'demo-v1', 0.5000, 'Fictional metric for development only.', true),
  ('de000000-0000-4000-8000-000000000710', 'de000000-0000-4000-8000-000000000103', 'stability', 5.8, 58, 'demo_1_to_10', 'DEVELOPMENT/DEMO fixture', null, '2026-09-01', 'demo-v1', 0.5000, 'Fictional metric for development only.', true),
  ('de000000-0000-4000-8000-000000000711', 'de000000-0000-4000-8000-000000000103', 'responsiveness', 9.3, 93, 'demo_1_to_10', 'DEVELOPMENT/DEMO fixture', null, '2026-09-01', 'demo-v1', 0.5000, 'Fictional metric for development only.', true),
  ('de000000-0000-4000-8000-000000000712', 'de000000-0000-4000-8000-000000000103', 'value', 7.2, 72, 'demo_1_to_10', 'DEVELOPMENT/DEMO fixture', null, '2026-09-01', 'demo-v1', 0.5000, 'Fictional metric for development only.', true),
  ('de000000-0000-4000-8000-000000000713', 'de000000-0000-4000-8000-000000000104', 'cushioning', 8.1, 81, 'demo_1_to_10', 'DEVELOPMENT/DEMO fixture', null, '2026-09-01', 'demo-v1', 0.5000, 'Fictional metric for development only.', true),
  ('de000000-0000-4000-8000-000000000714', 'de000000-0000-4000-8000-000000000104', 'stability', 9.2, 92, 'demo_1_to_10', 'DEVELOPMENT/DEMO fixture', null, '2026-09-01', 'demo-v1', 0.5000, 'Fictional metric for development only.', true),
  ('de000000-0000-4000-8000-000000000715', 'de000000-0000-4000-8000-000000000104', 'responsiveness', 6.8, 68, 'demo_1_to_10', 'DEVELOPMENT/DEMO fixture', null, '2026-09-01', 'demo-v1', 0.5000, 'Fictional metric for development only.', true),
  ('de000000-0000-4000-8000-000000000716', 'de000000-0000-4000-8000-000000000104', 'value', 7.5, 75, 'demo_1_to_10', 'DEVELOPMENT/DEMO fixture', null, '2026-09-01', 'demo-v1', 0.5000, 'Fictional metric for development only.', true),
  ('de000000-0000-4000-8000-000000000717', 'de000000-0000-4000-8000-000000000105', 'cushioning', 9.1, 91, 'demo_1_to_10', 'DEVELOPMENT/DEMO fixture', null, '2026-09-01', 'demo-v1', 0.5000, 'Fictional metric for development only.', true),
  ('de000000-0000-4000-8000-000000000718', 'de000000-0000-4000-8000-000000000105', 'stability', 7.0, 70, 'demo_1_to_10', 'DEVELOPMENT/DEMO fixture', null, '2026-09-01', 'demo-v1', 0.5000, 'Fictional metric for development only.', true),
  ('de000000-0000-4000-8000-000000000719', 'de000000-0000-4000-8000-000000000105', 'responsiveness', 7.8, 78, 'demo_1_to_10', 'DEVELOPMENT/DEMO fixture', null, '2026-09-01', 'demo-v1', 0.5000, 'Fictional metric for development only.', true),
  ('de000000-0000-4000-8000-000000000720', 'de000000-0000-4000-8000-000000000105', 'value', 6.5, 65, 'demo_1_to_10', 'DEVELOPMENT/DEMO fixture', null, '2026-09-01', 'demo-v1', 0.5000, 'Fictional metric for development only.', true),
  ('de000000-0000-4000-8000-000000000721', 'de000000-0000-4000-8000-000000000106', 'cushioning', 7.5, 75, 'demo_1_to_10', 'DEVELOPMENT/DEMO fixture', null, '2026-09-01', 'demo-v1', 0.5000, 'Fictional metric for development only.', true),
  ('de000000-0000-4000-8000-000000000722', 'de000000-0000-4000-8000-000000000106', 'stability', 6.8, 68, 'demo_1_to_10', 'DEVELOPMENT/DEMO fixture', null, '2026-09-01', 'demo-v1', 0.5000, 'Fictional metric for development only.', true),
  ('de000000-0000-4000-8000-000000000723', 'de000000-0000-4000-8000-000000000106', 'responsiveness', 7.4, 74, 'demo_1_to_10', 'DEVELOPMENT/DEMO fixture', null, '2026-09-01', 'demo-v1', 0.5000, 'Fictional metric for development only.', true),
  ('de000000-0000-4000-8000-000000000724', 'de000000-0000-4000-8000-000000000106', 'value', 9.2, 92, 'demo_1_to_10', 'DEVELOPMENT/DEMO fixture', null, '2026-09-01', 'demo-v1', 0.5000, 'Fictional metric for development only.', true)
  on conflict (shoe_id, metric_key, effective_date, metric_version, data_source) do nothing;

-- Publish only this seed's still-draft snapshots after all results exist.
  update public.ranking_runs
  set
  status = 'published',
  published_at = case id
    when 'de000000-0000-4000-8000-000000000501'::uuid then '2026-08-02 12:00:00+00'::timestamptz
    when 'de000000-0000-4000-8000-000000000502'::uuid then '2026-09-02 12:00:00+00'::timestamptz
  end
where id = any (array[
  'de000000-0000-4000-8000-000000000501'::uuid,
  'de000000-0000-4000-8000-000000000502'::uuid
])
  and status = 'draft';

end
$development_demo_seed$;
