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
)
select check_name, issue_count
from checks
order by display_order;
