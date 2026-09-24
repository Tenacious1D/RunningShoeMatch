-- Eligibility must always belong to the reviewed ranking-input version that
-- supplied its fit and cushion classifications.

alter table public.shoe_ranking_category_eligibility
  add constraint shoe_ranking_eligibility_input_version_fk foreign key (
    shoe_id, methodology_version, effective_date
  ) references public.shoe_ranking_inputs (
    shoe_id, methodology_version, effective_date
  ) on delete cascade;

comment on constraint shoe_ranking_eligibility_input_version_fk
on public.shoe_ranking_category_eligibility is
  'Prevents category eligibility from existing without its matching reviewed methodology input version.';
