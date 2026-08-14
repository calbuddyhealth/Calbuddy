do $$
declare
  r record;
begin
  for r in
    select format('%I.%I', n.nspname, c.relname) as qualified_name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r','p')
      and c.relowner = 'postgres'::regrole
  loop
    execute format('revoke maintain on table %s from anon, authenticated', r.qualified_name);
  end loop;
end
$$;

alter default privileges for role postgres in schema public
  revoke maintain on tables from anon, authenticated;
