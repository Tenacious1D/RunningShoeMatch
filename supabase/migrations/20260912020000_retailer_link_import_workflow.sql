begin;

do $$
begin
  if exists (
    select 1
    from public.shoe_retailer_links
    group by shoe_id, retailer_id
    having count(*) > 1
  ) then
    raise exception 'Cannot enforce one retailer relationship per shoe: duplicate shoe/retailer rows already exist';
  end if;
end;
$$;

alter table public.shoe_retailer_links
  drop constraint shoe_retailer_links_unique_destination;

alter table public.shoe_retailer_links
  add constraint shoe_retailer_links_unique_retailer
  unique (shoe_id, retailer_id);

comment on constraint shoe_retailer_links_unique_retailer on public.shoe_retailer_links is
  'A retailer has one current relationship per shoe. URLs and displayed prices are mutable attributes of that relationship.';

create or replace function public.import_retailer_links(
  p_new_retailers jsonb,
  p_links jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  created_retailer_count integer := 0;
  processed_link_count integer := 0;
begin
  if jsonb_typeof(p_new_retailers) <> 'array' or jsonb_typeof(p_links) <> 'array' then
    raise exception 'Retailer and link payloads must be JSON arrays';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_new_retailers) as retailer(slug text)
    group by retailer.slug
    having count(*) > 1
  ) then
    raise exception 'Duplicate retailer slugs are not allowed in one import';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_links) as link(shoe_slug text, retailer_slug text)
    group by link.shoe_slug, link.retailer_slug
    having count(*) > 1
  ) then
    raise exception 'Duplicate shoe/retailer relationships are not allowed in one import';
  end if;

  insert into public.retailers (name, slug, homepage_url, active)
  select retailer.name, retailer.slug, retailer.homepage_url, retailer.active
  from jsonb_to_recordset(p_new_retailers) as retailer(
    name text,
    slug text,
    homepage_url text,
    active boolean
  )
  on conflict (slug) do nothing;

  get diagnostics created_retailer_count = row_count;

  if exists (
    select 1
    from jsonb_to_recordset(p_new_retailers) as requested(name text, slug text)
    left join public.retailers as stored on stored.slug = requested.slug
    where stored.id is null or lower(stored.name) <> lower(requested.name)
  ) then
    raise exception 'A requested retailer could not be created or conflicts with an existing retailer';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_links) as link(shoe_slug text, retailer_slug text)
    left join public.shoes as shoe on shoe.slug = link.shoe_slug
    left join public.retailers as retailer on retailer.slug = link.retailer_slug
    where shoe.id is null or retailer.id is null
  ) then
    raise exception 'Every retailer link must reference an existing shoe and retailer';
  end if;

  if exists (
    with incoming as (
      select
        shoe.id as shoe_id,
        retailer.id as retailer_id,
        link.active,
        link.is_primary
      from jsonb_to_recordset(p_links) as link(
        shoe_slug text,
        retailer_slug text,
        active boolean,
        is_primary boolean
      )
      join public.shoes as shoe on shoe.slug = link.shoe_slug
      join public.retailers as retailer on retailer.slug = link.retailer_slug
    ),
    final_state as (
      select stored.shoe_id, stored.retailer_id, stored.active, stored.is_primary
      from public.shoe_retailer_links as stored
      where not exists (
        select 1
        from incoming
        where incoming.shoe_id = stored.shoe_id
          and incoming.retailer_id = stored.retailer_id
      )
      union all
      select shoe_id, retailer_id, active, is_primary
      from incoming
    )
    select 1
    from final_state
    where active and is_primary
    group by shoe_id
    having count(*) > 1
  ) then
    raise exception 'A shoe may have only one active primary retailer link';
  end if;

  update public.shoe_retailer_links as stored
  set is_primary = false
  where stored.active
    and stored.is_primary
    and exists (
      select 1
      from jsonb_to_recordset(p_links) as link(shoe_slug text, active boolean, is_primary boolean)
      join public.shoes as shoe on shoe.slug = link.shoe_slug
      where shoe.id = stored.shoe_id
        and link.active
        and link.is_primary
    );

  insert into public.shoe_retailer_links (
    shoe_id, retailer_id, affiliate_url, regular_url, displayed_price,
    currency, is_primary, active, last_verified_at
  )
  select
    shoe.id, retailer.id, link.affiliate_url, link.regular_url,
    link.displayed_price, link.currency, link.is_primary, link.active,
    link.last_verified_at
  from jsonb_to_recordset(p_links) as link(
    shoe_slug text,
    retailer_slug text,
    affiliate_url text,
    regular_url text,
    displayed_price numeric,
    currency text,
    is_primary boolean,
    active boolean,
    last_verified_at timestamptz
  )
  join public.shoes as shoe on shoe.slug = link.shoe_slug
  join public.retailers as retailer on retailer.slug = link.retailer_slug
  on conflict (shoe_id, retailer_id) do update
  set affiliate_url = excluded.affiliate_url,
      regular_url = excluded.regular_url,
      displayed_price = excluded.displayed_price,
      currency = excluded.currency,
      is_primary = excluded.is_primary,
      active = excluded.active,
      last_verified_at = excluded.last_verified_at;

  get diagnostics processed_link_count = row_count;

  return jsonb_build_object(
    'created_retailers', created_retailer_count,
    'processed_links', processed_link_count
  );
end;
$$;

revoke all on function public.import_retailer_links(jsonb, jsonb) from public;
revoke all on function public.import_retailer_links(jsonb, jsonb) from anon;
revoke all on function public.import_retailer_links(jsonb, jsonb) from authenticated;
grant execute on function public.import_retailer_links(jsonb, jsonb) to service_role;

comment on function public.import_retailer_links(jsonb, jsonb) is
  'Service-role-only atomic importer for explicitly approved retailer creation and idempotent shoe/retailer link upserts.';

commit;
