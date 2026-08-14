revoke select on table public.ari_knowledge_nodes from anon;

drop policy if exists "Allow anon authenticated read ari knowledge nodes"
  on public.ari_knowledge_nodes;

create policy "Authenticated users can read ARI knowledge nodes"
  on public.ari_knowledge_nodes
  for select
  to authenticated
  using (true);
