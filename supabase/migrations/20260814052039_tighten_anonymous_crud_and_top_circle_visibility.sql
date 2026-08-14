revoke select, insert, update, delete on table public.activity_logs from anon;
revoke select, insert, update, delete on table public.food_entries from anon;
revoke select, insert, update, delete on table public.meal_logs from anon;
revoke select, insert, update, delete on table public.meals from anon;
revoke select, insert, update, delete on table public.profiles from anon;
revoke select, insert, update, delete on table public.weight_logs from anon;

revoke select on table public.ari_circle_top_members from anon;

drop policy if exists "Top Circle is publicly readable"
  on public.ari_circle_top_members;

create policy "Verified viewers can read visible Top Circle members"
  on public.ari_circle_top_members
  for select
  to authenticated
  using (
    public.ari_circle_can_view_user(owner_user_id)
    and public.ari_circle_can_view_user(member_user_id)
  );
