begin;

set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public;

select plan(27);

select has_column('public', 'shoes', column_name, format('shoes.%s exists', column_name))
from unnest(array[
  'manufacturer_support_label',
  'weight_value',
  'weight_unit',
  'general_stack_height_mm'
]) as column_name;

select ok(
  exists (
    select 1
    from pg_constraint
    where conrelid = 'public.shoes'::regclass
      and conname = constraint_name
      and contype = 'c'
  ),
  format('%s exists', constraint_name)
)
from unnest(array[
  'shoes_manufacturer_support_label_not_blank',
  'shoes_weight_value_positive',
  'shoes_weight_unit_allowed',
  'shoes_general_stack_height_mm_range',
  'shoes_weight_value_unit_complete',
  'shoes_unit_weight_has_reference'
]) as constraint_name;

insert into public.brands (id, name, slug)
values ('19000000-0000-0000-0000-000000000001', 'Unit Test Brand', 'unit-test-brand');

insert into public.shoes (
  id, brand_id, model_name, slug, status, is_public,
  manufacturer_support_label, weight_value, weight_unit,
  weight_reference_size, weight_reference_category,
  general_stack_height_mm
)
values (
  '19000000-0000-0000-0000-000000000011',
  '19000000-0000-0000-0000-000000000001',
  'Gram Test Shoe',
  'gram-test-shoe',
  'active',
  false,
  'Balanced',
  238,
  'g',
  'UK 8.5',
  'men',
  30
);

select is((select weight_value from public.shoes where id = '19000000-0000-0000-0000-000000000011'), 238::numeric, 'grams are preserved without conversion');
select is((select weight_unit from public.shoes where id = '19000000-0000-0000-0000-000000000011'), 'g', 'gram unit is preserved');
select is((select weight_reference_size from public.shoes where id = '19000000-0000-0000-0000-000000000011'), 'UK 8.5', 'reference size is preserved exactly');
select is((select weight_reference_category from public.shoes where id = '19000000-0000-0000-0000-000000000011'), 'men', 'reference category is preserved');
select is((select manufacturer_support_label from public.shoes where id = '19000000-0000-0000-0000-000000000011'), 'Balanced', 'manufacturer support label is preserved');
select is((select support_category from public.shoes where id = '19000000-0000-0000-0000-000000000011'), null::text, 'manufacturer label does not populate canonical support');
select is((select general_stack_height_mm from public.shoes where id = '19000000-0000-0000-0000-000000000011'), 30::numeric, 'general stack value is preserved');
select is((select heel_stack_height_mm from public.shoes where id = '19000000-0000-0000-0000-000000000011'), null::numeric, 'general stack does not populate heel stack');
select is((select forefoot_stack_height_mm from public.shoes where id = '19000000-0000-0000-0000-000000000011'), null::numeric, 'general stack does not populate forefoot stack');

insert into public.shoes (
  id, brand_id, model_name, slug, weight_value, weight_unit,
  weight_reference_size, weight_reference_category
)
values (
  '19000000-0000-0000-0000-000000000012',
  '19000000-0000-0000-0000-000000000001',
  'Ounce Test Shoe',
  'ounce-test-shoe',
  6.7,
  'oz',
  'US 10',
  'men'
);

select is((select weight_value from public.shoes where id = '19000000-0000-0000-0000-000000000012'), 6.7::numeric, 'ounces are preserved without conversion');
select is((select weight_unit from public.shoes where id = '19000000-0000-0000-0000-000000000012'), 'oz', 'ounce unit is preserved');

select throws_ok(
  $$insert into public.shoes (id, brand_id, model_name, slug, weight_value, weight_unit, weight_reference_size, weight_reference_category) values ('19000000-0000-0000-0000-000000000013', '19000000-0000-0000-0000-000000000001', 'Bad Unit', 'bad-weight-unit', 238, 'kg', 'UK 8.5', 'men')$$,
  '23514',
  null,
  'the database rejects an unsupported weight unit'
);

select lives_ok(
  $$insert into public.shoes (id, brand_id, model_name, slug) values ('19000000-0000-0000-0000-000000000014', '19000000-0000-0000-0000-000000000001', 'Missing Weight', 'missing-weight')$$,
  'a missing weight remains valid'
);

select lives_ok(
  $$insert into public.shoes (id, brand_id, model_name, slug, weight_oz, weight_reference_size, weight_reference_category) values ('19000000-0000-0000-0000-000000000015', '19000000-0000-0000-0000-000000000001', 'Legacy Weight', 'legacy-weight', 8.5, 'US 9', 'men')$$,
  'legacy ounce-only data remains compatible'
);

select is((select weight_oz from public.shoes where id = '19000000-0000-0000-0000-000000000015'), 8.5::numeric, 'legacy ounce value remains intact');
select is((select weight_value from public.shoes where id = '19000000-0000-0000-0000-000000000015'), null::numeric, 'legacy data is not silently copied into the new representation');

select throws_ok(
  $$insert into public.shoes (id, brand_id, model_name, slug, support_category) values ('19000000-0000-0000-0000-000000000016', '19000000-0000-0000-0000-000000000001', 'Bad Canonical Support', 'bad-canonical-support', 'guided')$$,
  '23514',
  null,
  'canonical support validation remains enforced'
);

select * from finish();
rollback;

