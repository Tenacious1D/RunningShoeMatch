begin;

set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public;

select plan(13);

select has_function('public', 'import_retailer_links', array['jsonb', 'jsonb'], 'transactional retailer-link import function exists');
select ok(not has_function_privilege('anon', 'public.import_retailer_links(jsonb,jsonb)', 'EXECUTE'), 'anon cannot execute retailer-link imports');
select ok(not has_function_privilege('authenticated', 'public.import_retailer_links(jsonb,jsonb)', 'EXECUTE'), 'authenticated cannot execute retailer-link imports');

insert into public.brands (id, name, slug)
values ('13000000-0000-0000-0000-000000000001', 'Phase Thirteen Brand', 'phase-thirteen-brand');

insert into public.shoes (id, brand_id, model_name, slug, status, spec_verification_status, is_public)
values ('13000000-0000-0000-0000-000000000011', '13000000-0000-0000-0000-000000000001', 'Phase Thirteen Shoe', 'phase-thirteen-shoe', 'active', 'unverified', false);

select is(
  (public.import_retailer_links(
    '[{"name":"Phase Thirteen Retailer","slug":"phase-thirteen-retailer","homepage_url":"https://retailer.example","active":true}]'::jsonb,
    '[{"shoe_slug":"phase-thirteen-shoe","retailer_slug":"phase-thirteen-retailer","affiliate_url":"https://retailer.example/first","regular_url":null,"displayed_price":120,"currency":"USD","is_primary":true,"active":true,"last_verified_at":"2026-09-11T00:00:00Z"}]'::jsonb
  )->>'created_retailers')::integer,
  1,
  'explicit retailer creation occurs inside the import transaction'
);

select is((select count(*)::integer from public.shoe_retailer_links where shoe_id = '13000000-0000-0000-0000-000000000011'), 1, 'one link is created');
select is((select affiliate_url from public.shoe_retailer_links where shoe_id = '13000000-0000-0000-0000-000000000011'), 'https://retailer.example/first', 'the affiliate URL is stored');

select lives_ok(
  $$select public.import_retailer_links('[]'::jsonb, '[{"shoe_slug":"phase-thirteen-shoe","retailer_slug":"phase-thirteen-retailer","affiliate_url":"https://retailer.example/updated","regular_url":"https://retailer.example/plain","displayed_price":115,"currency":"USD","is_primary":true,"active":true,"last_verified_at":"2026-09-12T00:00:00Z"}]'::jsonb)$$,
  'reimport updates the current relationship'
);
select is((select count(*)::integer from public.shoe_retailer_links where shoe_id = '13000000-0000-0000-0000-000000000011'), 1, 'URL changes do not create duplicate shoe/retailer rows');
select is((select affiliate_url from public.shoe_retailer_links where shoe_id = '13000000-0000-0000-0000-000000000011'), 'https://retailer.example/updated', 'the existing relationship receives the changed URL');

insert into public.retailers (id, name, slug, homepage_url, active)
values ('13000000-0000-0000-0000-000000000022', 'Second Retailer', 'second-retailer', 'https://second.example', true);

select throws_ok(
  $$select public.import_retailer_links('[]'::jsonb, '[{"shoe_slug":"phase-thirteen-shoe","retailer_slug":"second-retailer","affiliate_url":"https://second.example/shoe","regular_url":null,"displayed_price":110,"currency":"USD","is_primary":true,"active":true,"last_verified_at":null}]'::jsonb)$$,
  'P0001',
  'A shoe may have only one active primary retailer link',
  'an omitted current primary prevents an unsafe second primary'
);
select is((select count(*)::integer from public.shoe_retailer_links where retailer_id = '13000000-0000-0000-0000-000000000022'), 0, 'a failed import leaves no partial link');

select throws_ok(
  $$select public.import_retailer_links('[]'::jsonb, '[{"shoe_slug":"missing-shoe","retailer_slug":"phase-thirteen-retailer","affiliate_url":"https://retailer.example/missing","regular_url":null,"displayed_price":100,"currency":"USD","is_primary":false,"active":true,"last_verified_at":null}]'::jsonb)$$,
  'P0001',
  'Every retailer link must reference an existing shoe and retailer',
  'missing references abort the import'
);
select is((select count(*)::integer from public.shoe_retailer_links where shoe_id = '13000000-0000-0000-0000-000000000011'), 1, 'failed reference validation leaves prior data unchanged');

select * from finish();
rollback;
