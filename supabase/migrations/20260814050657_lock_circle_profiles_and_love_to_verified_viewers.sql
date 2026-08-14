-- ARI XP App Store readiness
-- Keep ARI Circle profile/comment reads inside the signed-in, verified age-cohort
-- boundary instead of exposing profile rows and Leave Some Love comments to anon.

create or replace function public.ari_circle_can_view_user(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    auth.uid() is not null
    and target_user_id is not null
    and (
      target_user_id = auth.uid()
      or (
        public.ari_circle_same_verified_cohort(auth.uid(), target_user_id)
        and not public.ari_circle_social_pair_is_blocked(auth.uid(), target_user_id)
      )
    );
$$;

revoke execute on function public.ari_circle_can_view_user(uuid)
  from public, anon, service_role;
grant execute on function public.ari_circle_can_view_user(uuid)
  to authenticated;

drop policy if exists "ARI Circle profiles are publicly readable"
  on public.ari_circle_profiles;
create policy "Verified Circle users read visible profiles"
on public.ari_circle_profiles
for select
to authenticated
using (public.ari_circle_can_view_user(user_id));

drop policy if exists "Circle comments are publicly readable"
  on public.ari_circle_comments;
create policy "Verified Circle users read visible comments"
on public.ari_circle_comments
for select
to authenticated
using (
  auth.uid() = profile_user_id
  or auth.uid() = author_user_id
  or (
    public.ari_circle_can_view_user(profile_user_id)
    and public.ari_circle_can_view_user(author_user_id)
  )
);

drop policy if exists "Authenticated users can leave some love"
  on public.ari_circle_comments;
create policy "Verified Circle users can leave some love"
on public.ari_circle_comments
for insert
to authenticated
with check (
  auth.uid() = author_user_id
  and public.ari_circle_can_view_user(profile_user_id)
);

revoke select on public.ari_circle_profiles from anon;
revoke select on public.ari_circle_comments from anon;
