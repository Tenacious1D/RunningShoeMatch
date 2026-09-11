-- Keep one permissive SELECT policy per browser role and table. Public rows
-- remain visible to both roles, while authenticated administrators can also
-- read operational rows through the explicit allowlist.

drop policy brands_public_read on public.brands;
drop policy brands_admin_read on public.brands;
create policy brands_public_read on public.brands for select to anon
using (exists (select 1 from public.shoes where shoes.brand_id = brands.id and shoes.is_public));
create policy brands_authenticated_read on public.brands for select to authenticated
using (
  (select private.is_admin())
  or exists (select 1 from public.shoes where shoes.brand_id = brands.id and shoes.is_public)
);

drop policy shoes_public_read on public.shoes;
drop policy shoes_admin_read on public.shoes;
create policy shoes_public_read on public.shoes for select to anon using (is_public);
create policy shoes_authenticated_read on public.shoes for select to authenticated
using ((select private.is_admin()) or is_public);

drop policy retailers_public_read on public.retailers;
drop policy retailers_admin_read on public.retailers;
create policy retailers_public_read on public.retailers for select to anon using (active);
create policy retailers_authenticated_read on public.retailers for select to authenticated
using ((select private.is_admin()) or active);

drop policy shoe_retailer_links_public_read on public.shoe_retailer_links;
drop policy shoe_retailer_links_admin_read on public.shoe_retailer_links;
create policy shoe_retailer_links_public_read on public.shoe_retailer_links for select to anon
using (
  active
  and exists (select 1 from public.shoes where shoes.id = shoe_retailer_links.shoe_id and shoes.is_public)
  and exists (select 1 from public.retailers where retailers.id = shoe_retailer_links.retailer_id and retailers.active)
);
create policy shoe_retailer_links_authenticated_read on public.shoe_retailer_links for select to authenticated
using (
  (select private.is_admin())
  or (
    active
    and exists (select 1 from public.shoes where shoes.id = shoe_retailer_links.shoe_id and shoes.is_public)
    and exists (select 1 from public.retailers where retailers.id = shoe_retailer_links.retailer_id and retailers.active)
  )
);

drop policy ranking_categories_public_read on public.ranking_categories;
drop policy ranking_categories_admin_read on public.ranking_categories;
create policy ranking_categories_public_read on public.ranking_categories for select to anon using (active);
create policy ranking_categories_authenticated_read on public.ranking_categories for select to authenticated
using ((select private.is_admin()) or active);

drop policy ranking_runs_public_read on public.ranking_runs;
drop policy ranking_runs_admin_read on public.ranking_runs;
create policy ranking_runs_public_read on public.ranking_runs for select to anon
using (status = 'published' and published_at <= now());
create policy ranking_runs_authenticated_read on public.ranking_runs for select to authenticated
using ((select private.is_admin()) or (status = 'published' and published_at <= now()));

drop policy ranking_results_public_read on public.ranking_results;
drop policy ranking_results_admin_read on public.ranking_results;
create policy ranking_results_public_read on public.ranking_results for select to anon
using (
  exists (
    select 1 from public.ranking_runs
    where ranking_runs.id = ranking_results.ranking_run_id
      and ranking_runs.status = 'published'
      and ranking_runs.published_at <= now()
  )
  and exists (
    select 1 from public.ranking_categories
    where ranking_categories.id = ranking_results.ranking_category_id
      and ranking_categories.active
  )
  and exists (
    select 1 from public.shoes
    where shoes.id = ranking_results.shoe_id
      and shoes.is_public
  )
);
create policy ranking_results_authenticated_read on public.ranking_results for select to authenticated
using (
  (select private.is_admin())
  or (
    exists (
      select 1 from public.ranking_runs
      where ranking_runs.id = ranking_results.ranking_run_id
        and ranking_runs.status = 'published'
        and ranking_runs.published_at <= now()
    )
    and exists (
      select 1 from public.ranking_categories
      where ranking_categories.id = ranking_results.ranking_category_id
        and ranking_categories.active
    )
    and exists (
      select 1 from public.shoes
      where shoes.id = ranking_results.shoe_id
        and shoes.is_public
    )
  )
);

drop policy shoe_metrics_public_read on public.shoe_metrics;
drop policy shoe_metrics_admin_read on public.shoe_metrics;
create policy shoe_metrics_public_read on public.shoe_metrics for select to anon
using (
  is_public
  and exists (select 1 from public.shoes where shoes.id = shoe_metrics.shoe_id and shoes.is_public)
);
create policy shoe_metrics_authenticated_read on public.shoe_metrics for select to authenticated
using (
  (select private.is_admin())
  or (
    is_public
    and exists (select 1 from public.shoes where shoes.id = shoe_metrics.shoe_id and shoes.is_public)
  )
);
