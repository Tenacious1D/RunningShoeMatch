begin;

set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public;

select plan(17);

select has_column('public', 'shoes', column_name, format('shoes.%s exists', column_name))
from unnest(array[
  'primary_surface',
  'support_category',
  'weight_oz',
  'weight_reference',
  'heel_to_toe_drop_mm',
  'heel_stack_height_mm',
  'forefoot_stack_height_mm',
  'available_widths',
  'spec_source_name',
  'spec_source_url',
  'spec_verified_at',
  'spec_verification_status'
]) as column_name;

select has_column('public', 'shoe_metrics', column_name, format('shoe_metrics.%s exists', column_name))
from unnest(array[
  'metric_kind',
  'source_type',
  'verification_status'
]) as column_name;

select col_type_is('public', 'shoes', 'available_widths', 'text[]', 'available widths are queryable text values');
select col_type_is('public', 'shoe_metrics', 'metric_kind', 'text', 'metric kind is a typed column');

select * from finish();
rollback;

