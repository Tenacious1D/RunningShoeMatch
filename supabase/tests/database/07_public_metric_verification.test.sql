begin;

set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public;

select plan(4);

select ok(
  exists (
    select 1
    from pg_constraint
    where conrelid = 'public.shoe_metrics'::regclass
      and conname = 'shoe_metrics_public_requires_verification'
      and contype = 'c'
  ),
  'public metric verification is enforced by a database check constraint'
);

select is(
  (
    select count(*)
    from public.shoe_metrics
    where is_public
      and verification_status = 'unverified'
  ),
  0::bigint,
  'no public metric observation is unverified'
);

select is(
  (
    select count(*)
    from public.shoe_metrics as metric
    join public.shoes as shoe on shoe.id = metric.shoe_id
    where metric.id between 'de000000-0000-4000-8000-000000000701'::uuid
      and 'de000000-0000-4000-8000-000000000724'::uuid
      and (
        metric.source_type <> 'development_demo'
        or metric.verification_status <> 'development_demo'
        or not (shoe.metadata @> '{"development_demo": true}'::jsonb)
      )
  ),
  0::bigint,
  'reserved Phase 7 metric fixtures are explicitly classified as development demo data'
);

select throws_ok(
  $$insert into public.shoe_metrics (shoe_id, metric_key, value, data_source, effective_date, metric_version, verification_status, is_public) values ('de000000-0000-4000-8000-000000000101', 'constraint_probe', 1, 'pgTAP fixture', '2026-09-01', 'test-v1', 'unverified', true)$$,
  '23514',
  null,
  'the database rejects publication of an unverified metric'
);

select * from finish();
rollback;
