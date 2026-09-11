begin;

set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public;

select plan(20);

select has_table('public', 'admin_users', 'public.admin_users exists');
select has_pk('public', 'admin_users', 'admin_users has a primary key');
select has_column('public', 'admin_users', 'user_id', 'admin membership is tied to an Auth user ID');
select table_privs_are('public', 'admin_users', 'anon', array[]::text[], 'anon has no admin_users privileges');
select table_privs_are('public', 'admin_users', 'authenticated', array['SELECT'], 'authenticated can only select its permitted membership row');
select ok((select relrowsecurity from pg_class join pg_namespace on pg_namespace.oid = pg_class.relnamespace where nspname = 'public' and relname = 'admin_users'), 'RLS is enabled on admin_users');
select has_function('private', 'is_admin', array[]::text[], 'private admin authorization helper exists');
select ok(not has_function_privilege('anon', 'private.is_admin()', 'EXECUTE'), 'anon cannot execute the admin helper');
select ok(has_function_privilege('authenticated', 'private.is_admin()', 'EXECUTE'), 'authenticated can execute the admin helper through policies');

insert into auth.users (id, email)
values
  ('14000000-0000-0000-0000-000000000001', 'admin-test@example.com'),
  ('14000000-0000-0000-0000-000000000002', 'member-test@example.com');

insert into public.admin_users (user_id, notes)
values ('14000000-0000-0000-0000-000000000001', 'Rollback-only pgTAP administrator');

insert into public.brands (id, name, slug)
values
  ('14000000-0000-0000-0000-000000000011', 'Admin Public Brand', 'admin-public-brand'),
  ('14000000-0000-0000-0000-000000000012', 'Admin Private Brand', 'admin-private-brand');

insert into public.shoes (id, brand_id, model_name, slug, status, is_public)
values
  ('14000000-0000-0000-0000-000000000021', '14000000-0000-0000-0000-000000000011', 'Admin Public Shoe', 'admin-public-shoe', 'active', true),
  ('14000000-0000-0000-0000-000000000022', '14000000-0000-0000-0000-000000000012', 'Admin Private Shoe', 'admin-private-shoe', 'upcoming', false);

insert into public.ranking_runs (id, name, effective_date, methodology_version)
values ('14000000-0000-0000-0000-000000000031', 'Admin Draft Run', '2026-12-01', 'admin-test-v1');

set local role authenticated;
select set_config('request.jwt.claim.sub', '14000000-0000-0000-0000-000000000002', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is((select private.is_admin()), false, 'an authenticated non-member is not an admin');
select is((select count(*) from public.admin_users), 0::bigint, 'a non-admin cannot read another user membership');
select is((select count(*) from public.shoes where id between '14000000-0000-0000-0000-000000000021' and '14000000-0000-0000-0000-000000000022'), 1::bigint, 'a non-admin sees only public shoes');
select is((select count(*) from public.ranking_runs where id = '14000000-0000-0000-0000-000000000031'), 0::bigint, 'a non-admin cannot read draft ranking runs');

set local role postgres;
set local role authenticated;
select set_config('request.jwt.claim.sub', '14000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is((select private.is_admin()), true, 'an allowlisted authenticated user is an admin');
select is((select count(*) from public.admin_users), 1::bigint, 'an admin can read its own membership row');
select is((select count(*) from public.shoes where id between '14000000-0000-0000-0000-000000000021' and '14000000-0000-0000-0000-000000000022'), 2::bigint, 'an admin can read public and non-public shoes');
select is((select count(*) from public.brands where id between '14000000-0000-0000-0000-000000000011' and '14000000-0000-0000-0000-000000000012'), 2::bigint, 'an admin can read brands behind non-public shoes');
select is((select count(*) from public.ranking_runs where id = '14000000-0000-0000-0000-000000000031'), 1::bigint, 'an admin can read draft ranking runs');

select throws_ok(
  $$insert into public.admin_users (user_id) values ('14000000-0000-0000-0000-000000000002')$$,
  '42501',
  null,
  'authenticated admins cannot grant admin membership through the Data API'
);
select throws_ok(
  $$update public.shoes set model_name = 'Unauthorized write' where id = '14000000-0000-0000-0000-000000000022'$$,
  '42501',
  null,
  'admin read visibility does not grant catalog writes'
);

set local role postgres;
select * from finish();
rollback;
