-- ARI XP security hardening
-- App clients never need schema-structural table privileges. Remove them from
-- every current public table and from the postgres default privileges used for
-- future public tables. Normal SELECT/INSERT/UPDATE/DELETE grants are untouched.

revoke truncate, references, trigger on all tables in schema public
  from anon, authenticated;

alter default privileges for role postgres in schema public
  revoke truncate, references, trigger on tables from anon, authenticated;
