begin;

set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public;

select plan(16);

select has_column('public', 'ranking_runs', 'import_hash', 'ranking runs store an idempotency hash');
select has_function('public', 'import_ranking_snapshot', array['text', 'date', 'text', 'text', 'text', 'jsonb'], 'transactional ranking import function exists');
select has_function('public', 'publish_ranking_run', array['uuid'], 'transactional ranking publish function exists');
select ok(not has_function_privilege('anon', 'public.import_ranking_snapshot(text,date,text,text,text,jsonb)', 'EXECUTE'), 'anon cannot execute ranking imports');
select ok(not has_function_privilege('authenticated', 'public.import_ranking_snapshot(text,date,text,text,text,jsonb)', 'EXECUTE'), 'authenticated cannot execute ranking imports');
select ok(not has_function_privilege('anon', 'public.publish_ranking_run(uuid)', 'EXECUTE'), 'anon cannot publish rankings');

insert into public.brands (id, name, slug)
values ('12000000-0000-0000-0000-000000000001', 'Phase Twelve Brand', 'phase-twelve-brand');

insert into public.shoes (id, brand_id, model_name, slug, status, spec_verification_status, spec_verified_at, is_public)
values
  ('12000000-0000-0000-0000-000000000011', '12000000-0000-0000-0000-000000000001', 'Phase Twelve One', 'phase-twelve-one', 'active', 'source_checked', '2026-09-01', true),
  ('12000000-0000-0000-0000-000000000012', '12000000-0000-0000-0000-000000000001', 'Phase Twelve Two', 'phase-twelve-two', 'active', 'source_checked', '2026-09-01', true);

insert into public.ranking_categories (id, name, slug, active)
values ('12000000-0000-0000-0000-000000000021', 'Phase Twelve Category', 'phase-twelve-category', true);

create temporary table imported_run as
select (public.import_ranking_snapshot(
  'Phase Twelve Run',
  '2026-10-01',
  'v12',
  'Rollback-only test',
  repeat('a', 64),
  '[
    {"ranking_category_id":"12000000-0000-0000-0000-000000000021","shoe_id":"12000000-0000-0000-0000-000000000011","rank":1,"score":91,"component_scores":{"ride":92},"metadata":{}},
    {"ranking_category_id":"12000000-0000-0000-0000-000000000021","shoe_id":"12000000-0000-0000-0000-000000000012","rank":2,"score":87,"component_scores":{"ride":88},"metadata":{}}
  ]'::jsonb
)->>'ranking_run_id')::uuid as id;

select is((select status from public.ranking_runs where id = (select id from imported_run)), 'draft', 'imports create draft runs');
select is((select count(*)::integer from public.ranking_results where ranking_run_id = (select id from imported_run)), 2, 'the full result set is imported');
select is((public.import_ranking_snapshot(
  'Phase Twelve Run', '2026-10-01', 'v12', 'Rollback-only test', repeat('a', 64),
  '[{"ranking_category_id":"12000000-0000-0000-0000-000000000021","shoe_id":"12000000-0000-0000-0000-000000000011","rank":1,"score":91,"component_scores":{"ride":92},"metadata":{}}]'::jsonb
)->>'created')::boolean, false, 'repeated import hashes return the existing run');
select is((select count(*)::integer from public.ranking_runs where import_hash = repeat('a', 64)), 1, 'repeated imports do not duplicate runs');

select throws_ok(
  $$select public.import_ranking_snapshot('Bad Duplicate Rank', '2026-11-01', 'v12', null, repeat('b', 64), '[{"ranking_category_id":"12000000-0000-0000-0000-000000000021","shoe_id":"12000000-0000-0000-0000-000000000011","rank":1,"score":90},{"ranking_category_id":"12000000-0000-0000-0000-000000000021","shoe_id":"12000000-0000-0000-0000-000000000012","rank":1,"score":80}]'::jsonb)$$,
  'P0001',
  'Duplicate ranks are not allowed within a run/category',
  'duplicate ranks abort the import'
);
select is((select count(*)::integer from public.ranking_runs where import_hash = repeat('b', 64)), 0, 'a failed import leaves no partial run');

select is((public.publish_ranking_run((select id from imported_run))->>'status'), 'published', 'explicit publication publishes the run');
select isnt((select published_at::text from public.ranking_runs where id = (select id from imported_run)), null, 'publication records a timestamp');
select is((public.publish_ranking_run((select id from imported_run))->>'already_published')::boolean, true, 'repeated publication is idempotent');

select throws_ok(
  $$update public.ranking_runs set notes = 'changed' where id = (select id from imported_run)$$,
  'P0001',
  'Published ranking runs are immutable',
  'published imported runs remain immutable'
);

select * from finish();
rollback;
