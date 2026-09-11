-- Explicit administrator membership for the private admin area.
-- Authentication proves identity; presence in this table grants admin reads.

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  notes text constraint admin_users_notes_not_blank check (notes is null or length(btrim(notes)) > 0)
);

comment on table public.admin_users is
  'Explicit administrator allowlist tied to Supabase Auth users. Authentication alone never grants admin access.';
comment on column public.admin_users.created_by is
  'Optional audit reference to the Auth user who granted membership. Initial bootstrap may be null.';

create index admin_users_created_by_idx on public.admin_users (created_by) where created_by is not null;

alter table public.admin_users enable row level security;

revoke all on table public.admin_users from anon, authenticated;
grant select on table public.admin_users to authenticated;
grant all privileges on table public.admin_users to service_role;

create policy admin_users_read_own_membership
on public.admin_users
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

-- Keep authorization helpers outside the exposed public schema. The function
-- is SECURITY DEFINER solely to read the allowlist without recursive RLS.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated, service_role;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.admin_users
      where user_id = (select auth.uid())
    );
$$;

comment on function private.is_admin() is
  'Returns whether the current authenticated Supabase user is explicitly allowlisted as an administrator.';

revoke all on function private.is_admin() from public, anon, authenticated;
grant execute on function private.is_admin() to authenticated, service_role;

-- Admin pages currently need read-only operational visibility, including
-- drafts and non-public catalog rows. These policies add no write privileges.
create policy brands_admin_read
on public.brands for select to authenticated
using ((select private.is_admin()));

create policy shoes_admin_read
on public.shoes for select to authenticated
using ((select private.is_admin()));

create policy retailers_admin_read
on public.retailers for select to authenticated
using ((select private.is_admin()));

create policy shoe_retailer_links_admin_read
on public.shoe_retailer_links for select to authenticated
using ((select private.is_admin()));

create policy ranking_categories_admin_read
on public.ranking_categories for select to authenticated
using ((select private.is_admin()));

create policy ranking_runs_admin_read
on public.ranking_runs for select to authenticated
using ((select private.is_admin()));

create policy ranking_results_admin_read
on public.ranking_results for select to authenticated
using ((select private.is_admin()));

create policy shoe_metrics_admin_read
on public.shoe_metrics for select to authenticated
using ((select private.is_admin()));
