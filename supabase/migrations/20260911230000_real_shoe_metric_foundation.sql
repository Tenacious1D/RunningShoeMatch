-- Phase A: make real catalog specifications queryable and distinguish metric intent.
-- This migration is additive. Existing specs JSON and metric history remain intact.

alter table public.shoes
  add column primary_surface text
    constraint shoes_primary_surface_not_blank check (primary_surface is null or length(btrim(primary_surface)) > 0),
  add column support_category text
    constraint shoes_support_category_not_blank check (support_category is null or length(btrim(support_category)) > 0),
  add column weight_oz numeric(6, 2)
    constraint shoes_weight_oz_range check (weight_oz is null or weight_oz between 0.1 and 40),
  add column weight_reference text
    constraint shoes_weight_reference_not_blank check (weight_reference is null or length(btrim(weight_reference)) > 0),
  add column heel_to_toe_drop_mm numeric(5, 2)
    constraint shoes_heel_to_toe_drop_mm_range check (heel_to_toe_drop_mm is null or heel_to_toe_drop_mm between -10 and 40),
  add column heel_stack_height_mm numeric(5, 2)
    constraint shoes_heel_stack_height_mm_range check (heel_stack_height_mm is null or heel_stack_height_mm between 1 and 100),
  add column forefoot_stack_height_mm numeric(5, 2)
    constraint shoes_forefoot_stack_height_mm_range check (forefoot_stack_height_mm is null or forefoot_stack_height_mm between 1 and 100),
  add column available_widths text[] not null default '{}'::text[]
    constraint shoes_available_widths_no_blank check (array_position(available_widths, '') is null),
  add column spec_source_name text
    constraint shoes_spec_source_name_not_blank check (spec_source_name is null or length(btrim(spec_source_name)) > 0),
  add column spec_source_url text
    constraint shoes_spec_source_url_format check (spec_source_url is null or spec_source_url ~* '^https?://.+'),
  add column spec_verified_at date,
  add column spec_verification_status text not null default 'unverified'
    constraint shoes_spec_verification_status_allowed check (
      spec_verification_status in ('unverified', 'source_checked', 'cross_checked', 'development_demo')
    ),
  add column spec_notes text;

comment on column public.shoes.primary_surface is
  'Queryable catalog classification such as road or trail; this is not an evaluative score.';
comment on column public.shoes.support_category is
  'Queryable manufacturer/catalog support classification; this is not a stability score.';
comment on column public.shoes.weight_oz is
  'Manufacturer/specification-style listed weight in ounces. weight_reference records the stated sample size or variant.';
comment on column public.shoes.available_widths is
  'Normalized width keys available for this catalog record. The spreadsheet importer accepts pipe-separated values.';
comment on column public.shoes.spec_verification_status is
  'Review state for the core objective specification set. is_public remains the independent publication control.';
comment on column public.shoes.specs is
  'Supplemental, less-common manufacturer facts only. Core pilot specifications have typed relational columns.';

create index shoes_public_surface_idx
  on public.shoes (primary_surface, model_name)
  where is_public;

create index shoes_public_support_category_idx
  on public.shoes (support_category, model_name)
  where is_public;

alter table public.shoe_metrics
  add column metric_kind text not null default 'evaluative'
    constraint shoe_metrics_kind_allowed check (metric_kind in ('evaluative', 'use_case')),
  add column source_type text not null default 'editorial_assessment'
    constraint shoe_metrics_source_type_allowed check (
      source_type in ('manufacturer', 'review', 'lab_test', 'editorial_assessment', 'derived_methodology', 'development_demo')
    ),
  add column verification_status text not null default 'unverified'
    constraint shoe_metrics_verification_status_allowed check (
      verification_status in ('unverified', 'source_checked', 'cross_checked', 'methodology_reviewed', 'development_demo')
    );

comment on column public.shoe_metrics.metric_kind is
  'Separates review/testing evaluations from derived editorial use-case suitability. Objective specifications belong on shoes.';
comment on column public.shoe_metrics.source_type is
  'Controlled provenance category; data_source and source_reference identify the actual source or methodology.';
comment on column public.shoe_metrics.verification_status is
  'Editorial review state for this versioned observation. It does not publish a row by itself.';
comment on column public.shoe_metrics.value is
  'Source-scale or methodology-scale numeric value. It is never a ranking score or personalized match score.';

create index shoe_metrics_kind_key_effective_idx
  on public.shoe_metrics (metric_kind, metric_key, effective_date desc)
  where is_public;

