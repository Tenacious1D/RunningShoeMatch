-- Repair only the deterministic Phase 7 demo fixtures that predate the
-- verification columns, then enforce the publication invariant in PostgreSQL.

do $demo_metric_safety_check$
begin
  if exists (
    select 1
    from public.shoe_metrics as metric
    left join public.shoes as shoe on shoe.id = metric.shoe_id
    where metric.id between 'de000000-0000-4000-8000-000000000701'::uuid
      and 'de000000-0000-4000-8000-000000000724'::uuid
      and (
        metric.data_source <> 'DEVELOPMENT/DEMO fixture'
        or shoe.id is null
        or not (shoe.metadata @> '{"development_demo": true}'::jsonb)
      )
  ) then
    raise exception 'Refusing to reclassify a non-demo metric in the reserved Phase 7 ID range';
  end if;
end
$demo_metric_safety_check$;

-- These rows were public before verification_status existed, so the existing
-- immutability trigger must be bypassed for this narrowly scoped migration.
-- ALTER TABLE and UPDATE are transactional; a failure restores the trigger.
alter table public.shoe_metrics disable trigger shoe_metrics_guard_public;

update public.shoe_metrics as metric
set
  source_type = 'development_demo',
  verification_status = 'development_demo'
where metric.id between 'de000000-0000-4000-8000-000000000701'::uuid
  and 'de000000-0000-4000-8000-000000000724'::uuid
  and metric.data_source = 'DEVELOPMENT/DEMO fixture'
  and metric.verification_status = 'unverified'
  and exists (
    select 1
    from public.shoes as shoe
    where shoe.id = metric.shoe_id
      and shoe.metadata @> '{"development_demo": true}'::jsonb
  );

alter table public.shoe_metrics enable trigger shoe_metrics_guard_public;

-- Draft/internal rows may remain unverified. Publication requires an explicit
-- non-unverified state, including the clearly marked development_demo state.
alter table public.shoe_metrics
  add constraint shoe_metrics_public_requires_verification
  check (not is_public or verification_status <> 'unverified');

comment on constraint shoe_metrics_public_requires_verification on public.shoe_metrics is
  'Prevents an unverified observation from becoming publicly readable. Verification is always explicit.';

