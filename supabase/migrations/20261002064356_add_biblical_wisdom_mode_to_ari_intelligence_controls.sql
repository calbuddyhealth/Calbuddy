alter table public.ari_intelligence_controls
  add column if not exists biblical_wisdom_mode text not null default 'off';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ari_intelligence_controls_biblical_wisdom_mode_check'
      and conrelid = 'public.ari_intelligence_controls'::regclass
  ) then
    alter table public.ari_intelligence_controls
      add constraint ari_intelligence_controls_biblical_wisdom_mode_check
      check (biblical_wisdom_mode in ('off','consultative','primary'));
  end if;
end
$$;

comment on column public.ari_intelligence_controls.biblical_wisdom_mode is
  'Owner-selected Biblical Wisdom Core mode. Off for non-owner/default use; consultative and primary are bounded interpretive modes.';

update public.ari_intelligence_controls
set biblical_wisdom_mode = 'consultative',
    updated_at = now()
where advanced_enabled = true
  and biblical_wisdom_mode = 'off';
