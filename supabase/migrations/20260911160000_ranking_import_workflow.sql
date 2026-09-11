-- Transactional draft import and explicit publication workflow for ranking
-- snapshots. These functions are callable only with the server-side
-- service_role credential; browser roles receive no execute privilege.

alter table public.ranking_runs
add column import_hash text
constraint ranking_runs_import_hash_format
check (import_hash is null or import_hash ~ '^[0-9a-f]{64}$');

comment on column public.ranking_runs.import_hash is
  'SHA-256 fingerprint of normalized imported snapshot content. Used to make repeated CSV imports idempotent.';

create unique index ranking_runs_import_hash_idx
on public.ranking_runs (import_hash)
where import_hash is not null;

create or replace function public.import_ranking_snapshot(
  p_name text,
  p_effective_date date,
  p_methodology_version text,
  p_notes text,
  p_import_hash text,
  p_results jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_run public.ranking_runs%rowtype;
  new_run_id uuid;
  imported_count integer;
begin
  if length(btrim(p_name)) = 0 or length(btrim(p_methodology_version)) = 0 then
    raise exception 'Ranking run name and methodology version are required';
  end if;

  if p_import_hash is null or p_import_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'A valid SHA-256 import hash is required';
  end if;

  if jsonb_typeof(p_results) <> 'array' or jsonb_array_length(p_results) = 0 then
    raise exception 'Ranking snapshot must contain at least one result';
  end if;

  select * into existing_run
  from public.ranking_runs
  where import_hash = p_import_hash;

  if found then
    return jsonb_build_object(
      'ranking_run_id', existing_run.id,
      'created', false,
      'status', existing_run.status,
      'result_count', (
        select count(*) from public.ranking_results where ranking_run_id = existing_run.id
      )
    );
  end if;

  if exists (
    select 1 from public.ranking_runs
    where name = p_name and effective_date = p_effective_date
  ) then
    raise exception 'A different ranking snapshot already uses this name and effective date';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_results) as result(
      ranking_category_id uuid,
      shoe_id uuid,
      rank integer,
      score numeric,
      component_scores jsonb,
      metadata jsonb
    )
    where ranking_category_id is null
       or shoe_id is null
       or rank is null
       or rank <= 0
       or score is null
       or score < 0
       or score > 100
       or jsonb_typeof(coalesce(component_scores, '{}'::jsonb)) <> 'object'
       or jsonb_typeof(coalesce(metadata, '{}'::jsonb)) <> 'object'
  ) then
    raise exception 'Ranking results contain missing or invalid fields';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_results) as result(
      ranking_category_id uuid,
      shoe_id uuid,
      rank integer,
      score numeric,
      component_scores jsonb,
      metadata jsonb
    )
    group by ranking_category_id, shoe_id
    having count(*) > 1
  ) then
    raise exception 'Duplicate shoes are not allowed within a run/category';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_results) as result(
      ranking_category_id uuid,
      shoe_id uuid,
      rank integer,
      score numeric,
      component_scores jsonb,
      metadata jsonb
    )
    group by ranking_category_id, rank
    having count(*) > 1
  ) then
    raise exception 'Duplicate ranks are not allowed within a run/category';
  end if;

  if exists (
    select 1
    from (
      select ranking_category_id, min(rank) as minimum_rank, max(rank) as maximum_rank, count(*) as row_count
      from jsonb_to_recordset(p_results) as result(
        ranking_category_id uuid,
        shoe_id uuid,
        rank integer,
        score numeric,
        component_scores jsonb,
        metadata jsonb
      )
      group by ranking_category_id
    ) as sequence_check
    where minimum_rank <> 1 or maximum_rank <> row_count
  ) then
    raise exception 'Ranks must be contiguous and start at 1 within each category';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_results) as result(
      ranking_category_id uuid,
      shoe_id uuid,
      rank integer,
      score numeric,
      component_scores jsonb,
      metadata jsonb
    )
    cross join lateral jsonb_each(coalesce(result.component_scores, '{}'::jsonb)) as component(key, value)
    where component.key !~ '^[a-z][a-z0-9_]*$'
       or jsonb_typeof(component.value) <> 'number'
       or (component.value #>> '{}')::numeric < 0
       or (component.value #>> '{}')::numeric > 100
  ) then
    raise exception 'Component score keys or values are invalid';
  end if;

  insert into public.ranking_runs (
    name, effective_date, methodology_version, notes, status, published_at, import_hash
  ) values (
    btrim(p_name), p_effective_date, btrim(p_methodology_version), nullif(btrim(p_notes), ''), 'draft', null, p_import_hash
  ) returning id into new_run_id;

  insert into public.ranking_results (
    ranking_run_id, ranking_category_id, shoe_id, score, rank, component_scores, metadata
  )
  select
    new_run_id,
    result.ranking_category_id,
    result.shoe_id,
    result.score,
    result.rank,
    coalesce(result.component_scores, '{}'::jsonb),
    coalesce(result.metadata, '{}'::jsonb)
  from jsonb_to_recordset(p_results) as result(
    ranking_category_id uuid,
    shoe_id uuid,
    rank integer,
    score numeric,
    component_scores jsonb,
    metadata jsonb
  );

  get diagnostics imported_count = row_count;

  return jsonb_build_object(
    'ranking_run_id', new_run_id,
    'created', true,
    'status', 'draft',
    'result_count', imported_count
  );
end;
$$;

comment on function public.import_ranking_snapshot(text, date, text, text, text, jsonb) is
  'Atomically creates one draft ranking run and all results. A repeated normalized import returns its existing run.';

revoke all on function public.import_ranking_snapshot(text, date, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.import_ranking_snapshot(text, date, text, text, text, jsonb) to service_role;

create or replace function public.publish_ranking_run(p_ranking_run_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_run public.ranking_runs%rowtype;
  result_count integer;
begin
  select * into target_run
  from public.ranking_runs
  where id = p_ranking_run_id
  for update;

  if not found then
    raise exception 'Ranking run % does not exist', p_ranking_run_id;
  end if;

  select count(*) into result_count
  from public.ranking_results
  where ranking_run_id = p_ranking_run_id;

  if target_run.status = 'published' then
    return jsonb_build_object(
      'ranking_run_id', target_run.id,
      'status', target_run.status,
      'published_at', target_run.published_at,
      'result_count', result_count,
      'already_published', true
    );
  end if;

  if result_count = 0 then
    raise exception 'Cannot publish an empty ranking run';
  end if;

  if exists (
    select 1
    from public.ranking_results result
    join public.ranking_categories category on category.id = result.ranking_category_id
    where result.ranking_run_id = p_ranking_run_id
      and not category.active
  ) then
    raise exception 'Every ranking category must be active before publication';
  end if;

  if exists (
    select 1
    from public.ranking_results result
    join public.shoes shoe on shoe.id = result.shoe_id
    where result.ranking_run_id = p_ranking_run_id
      and not shoe.is_public
  ) then
    raise exception 'Every ranked shoe must be public before publication';
  end if;

  if exists (
    select 1
    from public.ranking_results
    where ranking_run_id = p_ranking_run_id
    group by ranking_category_id, rank
    having count(*) > 1
  ) then
    raise exception 'Duplicate ranks are not allowed within a published run/category';
  end if;

  if exists (
    select 1
    from (
      select ranking_category_id, min(rank) as minimum_rank, max(rank) as maximum_rank, count(*) as row_count
      from public.ranking_results
      where ranking_run_id = p_ranking_run_id
      group by ranking_category_id
    ) as sequence_check
    where minimum_rank <> 1 or maximum_rank <> row_count
  ) then
    raise exception 'Published ranks must be contiguous and start at 1 within each category';
  end if;

  update public.ranking_runs
  set status = 'published', published_at = clock_timestamp()
  where id = p_ranking_run_id
  returning * into target_run;

  return jsonb_build_object(
    'ranking_run_id', target_run.id,
    'status', target_run.status,
    'published_at', target_run.published_at,
    'result_count', result_count,
    'already_published', false
  );
end;
$$;

comment on function public.publish_ranking_run(uuid) is
  'Atomically validates and publishes one draft ranking snapshot. Published runs remain protected by immutability triggers.';

revoke all on function public.publish_ranking_run(uuid) from public, anon, authenticated;
grant execute on function public.publish_ranking_run(uuid) to service_role;
