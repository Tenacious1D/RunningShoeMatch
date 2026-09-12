-- Freeze the approved Metric Vocabulary Version 1 and objective catalog keys.
-- Historical columns remain in place; future vocabulary versions must replace
-- constraints additively and preserve existing versioned metric rows.

alter table public.shoes
  add column weight_reference_size text
    constraint shoes_weight_reference_size_not_blank check (
      weight_reference_size is null or length(btrim(weight_reference_size)) > 0
    ),
  add column weight_reference_category text
    constraint shoes_weight_reference_category_allowed check (
      weight_reference_category is null
      or weight_reference_category in ('men', 'women', 'unisex', 'not_stated')
    ),
  add constraint shoes_primary_surface_v1_allowed check (
    primary_surface is null or primary_surface in ('road', 'trail', 'track', 'hybrid')
  ),
  add constraint shoes_support_category_v1_allowed check (
    support_category is null or support_category in ('neutral', 'stability', 'motion_control')
  ),
  add constraint shoes_weight_reference_v1_complete check (
    (weight_reference_size is null and weight_reference_category is null)
    or (weight_reference_size is not null and weight_reference_category is not null)
  ),
  add constraint shoes_weight_v1_has_reference check (
    weight_oz is null
    or (weight_reference_size is not null and weight_reference_category is not null)
  ),
  add constraint shoes_public_requires_verified_specification_v1 check (
    not is_public
    or metadata @> '{"development_demo": true}'::jsonb
    or spec_verification_status in ('source_checked', 'cross_checked')
  );

comment on column public.shoes.weight_reference is
  'Legacy free-text weight context retained for historical compatibility. New imports use weight_reference_size and weight_reference_category.';
comment on column public.shoes.weight_reference_size is
  'Manufacturer-stated reference size preserved as written; no mathematical size conversion is performed.';
comment on column public.shoes.weight_reference_category is
  'Reference category for listed weight: men, women, unisex, or not_stated.';
comment on constraint shoes_public_requires_verified_specification_v1 on public.shoes is
  'Real public shoes require source_checked or cross_checked objective specifications. Explicit development fixtures are exempt.';

-- Convert only the deterministic Phase 7 demo observations from their legacy
-- 1-10 display scale to the approved canonical 0-100 score already retained in
-- normalized_value. The safety predicates prevent changes to real rows.
alter table public.shoe_metrics disable trigger shoe_metrics_guard_public;

update public.shoe_metrics as metric
set
  value = metric.normalized_value,
  normalized_value = null,
  unit = 'score_0_100'
where metric.id between 'de000000-0000-4000-8000-000000000701'::uuid
  and 'de000000-0000-4000-8000-000000000724'::uuid
  and metric.source_type = 'development_demo'
  and metric.verification_status = 'development_demo'
  and metric.normalized_value is not null
  and exists (
    select 1
    from public.shoes as shoe
    where shoe.id = metric.shoe_id
      and shoe.metadata @> '{"development_demo": true}'::jsonb
  );

alter table public.shoe_metrics enable trigger shoe_metrics_guard_public;

alter table public.shoe_metrics
  add constraint shoe_metrics_v1_score_range check (value between 0 and 100),
  add constraint shoe_metrics_v1_key_kind check (
    (
      metric_kind = 'evaluative'
      and metric_key in (
        'cushioning',
        'stability',
        'responsiveness',
        'flexibility',
        'durability',
        'comfort',
        'ground_feel',
        'energy_return',
        'value'
      )
    )
    or (
      metric_kind = 'use_case'
      and metric_key in (
        'daily_training',
        'long_run',
        'speed_workout',
        'racing',
        'walking',
        'beginner',
        'heavier_runner'
      )
    )
  );

comment on constraint shoe_metrics_v1_score_range on public.shoe_metrics is
  'Metric Vocabulary Version 1 stores all evaluative and use-case scores on the canonical 0-100 scale.';
comment on constraint shoe_metrics_v1_key_kind on public.shoe_metrics is
  'Approved Metric Vocabulary Version 1 key and kind combinations. Replace additively for a future vocabulary version.';

