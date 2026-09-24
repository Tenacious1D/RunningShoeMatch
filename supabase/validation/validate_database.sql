-- Read-only integrity checks consumed by scripts/validate-database.mjs.
-- Each row reports how many violations exist; zero means the check passed.

with checks as (
  select
    1 as display_order,
    'Every shoe references a valid brand' as check_name,
    (
      select count(*)
      from public.shoes as shoe
      left join public.brands as brand on brand.id = shoe.brand_id
      where brand.id is null
    ) as issue_count

  union all

  select
    2,
    'Slugs are unique within every slug-bearing table',
    (
      select count(*)
      from (
        select slug from public.brands group by slug having count(*) > 1
        union all
        select slug from public.shoes group by slug having count(*) > 1
        union all
        select slug from public.retailers group by slug having count(*) > 1
        union all
        select slug from public.ranking_categories group by slug having count(*) > 1
      ) as duplicate_slugs
    )

  union all

  select
    3,
    'Ranking results reference valid shoes, categories, and runs',
    (
      select count(*)
      from public.ranking_results as result
      left join public.shoes as shoe on shoe.id = result.shoe_id
      left join public.ranking_categories as category on category.id = result.ranking_category_id
      left join public.ranking_runs as run on run.id = result.ranking_run_id
      where shoe.id is null
        or category.id is null
        or run.id is null
    )

  union all

  select
    4,
    'Shoe/category/run ranking results are not duplicated',
    (
      select count(*)
      from (
        select ranking_run_id, ranking_category_id, shoe_id
        from public.ranking_results
        group by ranking_run_id, ranking_category_id, shoe_id
        having count(*) > 1
      ) as duplicate_results
    )

  union all

  select
    5,
    'Active affiliate links reference valid shoes and retailers',
    (
      select count(*)
      from public.shoe_retailer_links as link
      left join public.shoes as shoe on shoe.id = link.shoe_id
      left join public.retailers as retailer on retailer.id = link.retailer_id
      where link.active
        and (shoe.id is null or retailer.id is null)
    )

  union all

  select
    6,
    'Typed objective specifications include a provenance source',
    (
      select count(*)
      from public.shoes
      where (
        primary_surface is not null
        or support_category is not null
        or manufacturer_support_label is not null
        or weight_oz is not null
        or weight_value is not null
        or weight_unit is not null
        or weight_reference is not null
        or heel_to_toe_drop_mm is not null
        or general_stack_height_mm is not null
        or heel_stack_height_mm is not null
        or forefoot_stack_height_mm is not null
        or cardinality(available_widths) > 0
      )
        and spec_source_name is null
    )

  union all

  select
    7,
    'Reviewed objective specifications have a verification date',
    (
      select count(*)
      from public.shoes
      where spec_verification_status <> 'unverified'
        and spec_verified_at is null
    )

  union all

  select
    8,
    'Public metric observations are not unverified',
    (
      select count(*)
      from public.shoe_metrics
      where is_public
        and verification_status = 'unverified'
    )

  union all

  select
    9,
    'All Metric Vocabulary Version 1 scores stay within 0-100',
    (
      select count(*)
      from public.shoe_metrics
      where value not between 0 and 100
    )

  union all

  select
    10,
    'Public non-demo shoes have reviewed objective specification status',
    (
      select count(*)
      from public.shoes
      where is_public
        and spec_verification_status in ('unverified', 'development_demo')
        and not (metadata @> '{"development_demo": true}'::jsonb)
    )

  union all

  select
    11,
    'Surface and support values use the approved Version 1 vocabulary',
    (
      select count(*)
      from public.shoes
      where (primary_surface is not null and primary_surface not in ('road', 'trail', 'track', 'hybrid'))
        or (support_category is not null and support_category not in ('neutral', 'stability', 'motion_control'))
    )

  union all

  select
    12,
    'Listed weights preserve their unit and explicit reference',
    (
      select count(*)
      from public.shoes
      where (
        weight_oz is not null
        and (weight_reference_size is null or weight_reference_category is null)
      )
        or ((weight_value is null) <> (weight_unit is null))
        or (
          weight_value is not null
          and (
            weight_value <= 0
            or weight_unit not in ('g', 'oz')
            or weight_reference_size is null
            or weight_reference_category is null
          )
        )
    )

  union all

  select
    13,
    'Metric keys match their approved Version 1 kind',
    (
      select count(*)
      from public.shoe_metrics
      where not (
        metric_kind = 'evaluative'
        and metric_key in ('cushioning', 'stability', 'responsiveness', 'flexibility', 'durability', 'comfort', 'ground_feel', 'energy_return', 'value')
      )
        and not (
          metric_kind = 'use_case'
          and metric_key in ('daily_training', 'long_run', 'speed_workout', 'racing', 'walking', 'beginner', 'heavier_runner')
        )
    )

  union all

  select
    14,
    'Metric Vocabulary Version 1 rows declare the canonical score unit',
    (
      select count(*)
      from public.shoe_metrics
      where unit is distinct from 'score_0_100'
    )

  union all

  select
    15,
    'Ranking review observations use approved verified source records',
    (
      select count(*)
      from public.shoe_review_observations
      where source_key not in ('running-warehouse', 'fleet-feet', 'zappos', 'marathon-sports', 'road-runner-sports')
        or rating not between 1 and 5
        or review_count < 0
        or verification_status not in ('source_checked', 'cross_checked')
    )

  union all

  select
    16,
    'Ranking category eligibility belongs to a matching reviewed input version',
    (
      select count(*)
      from public.shoe_ranking_category_eligibility as eligibility
      left join public.shoe_ranking_inputs as input
        on input.shoe_id = eligibility.shoe_id
       and input.methodology_version = eligibility.methodology_version
       and input.effective_date = eligibility.effective_date
      where input.id is null
    )
)
select check_name, issue_count
from checks
order by display_order;
