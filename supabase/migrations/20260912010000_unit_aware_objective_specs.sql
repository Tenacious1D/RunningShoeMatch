-- Preserve manufacturer objective specifications without unit conversion or
-- automatic classification. Legacy weight_oz data remains readable in place.

alter table public.shoes
  add column manufacturer_support_label text
    constraint shoes_manufacturer_support_label_not_blank check (
      manufacturer_support_label is null or length(btrim(manufacturer_support_label)) > 0
    ),
  add column weight_value numeric(8, 2)
    constraint shoes_weight_value_positive check (
      weight_value is null or weight_value > 0
    ),
  add column weight_unit text
    constraint shoes_weight_unit_allowed check (
      weight_unit is null or weight_unit in ('g', 'oz')
    ),
  add column general_stack_height_mm numeric(5, 2)
    constraint shoes_general_stack_height_mm_range check (
      general_stack_height_mm is null or general_stack_height_mm between 1 and 100
    ),
  add constraint shoes_weight_value_unit_complete check (
    (weight_value is null and weight_unit is null)
    or (weight_value is not null and weight_unit is not null)
  ),
  add constraint shoes_unit_weight_has_reference check (
    weight_value is null
    or (weight_reference_size is not null and weight_reference_category is not null)
  );

comment on column public.shoes.manufacturer_support_label is
  'Manufacturer wording preserved as published. It never assigns support_category automatically.';
comment on column public.shoes.weight_value is
  'Manufacturer-listed weight preserved in the original weight_unit. New imports do not convert units.';
comment on column public.shoes.weight_unit is
  'Original manufacturer weight unit: g or oz. Normalized comparisons must derive a separate value.';
comment on column public.shoes.general_stack_height_mm is
  'Single manufacturer-published stack value when heel and forefoot are not explicitly identified.';
comment on column public.shoes.weight_oz is
  'Legacy ounce-only weight retained for migration and historical compatibility. New imports use weight_value and weight_unit.';

