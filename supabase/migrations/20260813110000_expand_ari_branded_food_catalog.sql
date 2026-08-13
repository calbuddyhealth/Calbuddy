-- =====================================================
-- ARI EXPERIENCE
-- Branded grocery food catalog + indexed search
-- Applied to production through Supabase on 2026-08-13.
-- =====================================================

create extension if not exists pg_trgm with schema extensions;

alter table public.food_database
  add column if not exists canonical_key text,
  add column if not exists display_name text,
  add column if not exists category text,
  add column if not exists subcategory text,
  add column if not exists aliases text[] not null default '{}',
  add column if not exists tags text[] not null default '{}',
  add column if not exists upcs text[] not null default '{}',
  add column if not exists serving_grams numeric,
  add column if not exists fiber_g numeric,
  add column if not exists sugar_g numeric,
  add column if not exists sodium_mg numeric,
  add column if not exists nutrition_basis_grams numeric not null default 100,
  add column if not exists source_type text,
  add column if not exists source_id text,
  add column if not exists source_url text,
  add column if not exists source_payload jsonb not null default '{}'::jsonb,
  add column if not exists verified boolean not null default false,
  add column if not exists confidence numeric not null default 0.5,
  add column if not exists popularity integer not null default 0,
  add column if not exists retailer_private_label boolean not null default false,
  add column if not exists active boolean not null default true,
  add column if not exists last_verified_at timestamptz,
  add column if not exists last_seen_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists search_text text not null default '',
  add column if not exists search_vector tsvector;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.food_database'::regclass
      and conname = 'food_database_canonical_key_key'
  ) then
    alter table public.food_database
      add constraint food_database_canonical_key_key unique (canonical_key);
  end if;
end
$$;

create or replace function public.ari_food_database_sync_search()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
begin
  new.display_name := coalesce(
    nullif(btrim(new.display_name), ''),
    concat_ws(' ', nullif(btrim(new.brand), ''), nullif(btrim(new.name), ''))
  );

  new.search_text := lower(
    regexp_replace(
      concat_ws(' ',
        coalesce(new.brand, ''),
        coalesce(new.name, ''),
        coalesce(new.display_name, ''),
        coalesce(new.category, ''),
        coalesce(new.subcategory, ''),
        array_to_string(coalesce(new.aliases, '{}'), ' '),
        array_to_string(coalesce(new.tags, '{}'), ' ')
      ),
      '\s+',
      ' ',
      'g'
    )
  );

  new.search_vector := to_tsvector('simple', new.search_text);
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.ari_food_database_sync_search() from public, anon, authenticated;

drop trigger if exists ari_food_database_sync_search_trigger on public.food_database;
create trigger ari_food_database_sync_search_trigger
before insert or update of brand, name, display_name, category, subcategory, aliases, tags
on public.food_database
for each row
execute function public.ari_food_database_sync_search();

update public.food_database
set name = name
where search_text = '' or search_vector is null;

create index if not exists food_database_search_vector_idx
  on public.food_database using gin (search_vector);

create index if not exists food_database_search_text_trgm_idx
  on public.food_database using gin (search_text extensions.gin_trgm_ops);

create index if not exists food_database_brand_lower_idx
  on public.food_database (lower(brand));

create index if not exists food_database_active_verified_idx
  on public.food_database (active, verified, popularity desc);

create index if not exists food_database_upcs_idx
  on public.food_database using gin (upcs);

create or replace function public.search_ari_food_database(
  search_query text,
  result_limit integer default 8
)
returns table (
  id uuid,
  canonical_key text,
  name text,
  display_name text,
  brand text,
  category text,
  subcategory text,
  aliases text[],
  tags text[],
  upcs text[],
  serving_size text,
  serving_grams numeric,
  calories numeric,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  fiber_g numeric,
  sugar_g numeric,
  sodium_mg numeric,
  nutrition_basis_grams numeric,
  source text,
  source_type text,
  source_id text,
  source_url text,
  verified boolean,
  confidence numeric,
  popularity integer,
  score double precision
)
language sql
stable
security invoker
set search_path = public, extensions, pg_catalog
as $$
  with q as (
    select
      btrim(
        regexp_replace(
          lower(coalesce(search_query, '')),
          '[^a-z0-9]+',
          ' ',
          'g'
        )
      ) as needle,
      greatest(1, least(coalesce(result_limit, 8), 12)) as lim
  ), prepared as (
    select
      q.*,
      case
        when q.needle = '' then null::tsquery
        else to_tsquery(
          'simple',
          regexp_replace(q.needle, '\s+', ':* & ', 'g') || ':*'
        )
      end as prefix_query
    from q
  )
  select
    f.id,
    f.canonical_key,
    f.name,
    f.display_name,
    f.brand,
    f.category,
    f.subcategory,
    f.aliases,
    f.tags,
    f.upcs,
    f.serving_size,
    f.serving_grams,
    f.calories,
    f.protein_g,
    f.carbs_g,
    f.fat_g,
    f.fiber_g,
    f.sugar_g,
    f.sodium_mg,
    f.nutrition_basis_grams,
    f.source,
    f.source_type,
    f.source_id,
    f.source_url,
    f.verified,
    f.confidence,
    f.popularity,
    (
      case
        when lower(coalesce(f.display_name, '')) = p.needle then 1000
        when lower(coalesce(f.name, '')) = p.needle then 960
        when lower(coalesce(f.brand, '')) = p.needle then 900
        when lower(coalesce(f.display_name, '')) like p.needle || '%' then 820
        when lower(coalesce(f.name, '')) like p.needle || '%' then 780
        when lower(coalesce(f.brand, '')) like p.needle || '%' then 740
        when f.search_text like '%' || p.needle || '%' then 520
        else 0
      end
      + coalesce(ts_rank_cd(f.search_vector, p.prefix_query), 0) * 350
      + extensions.similarity(f.search_text, p.needle) * 180
      + case when f.verified then 60 else 0 end
      + greatest(0, least(coalesce(f.confidence, 0), 1)) * 30
      + greatest(0, least(coalesce(f.popularity, 0), 100)) / 5.0
    )::double precision as score
  from public.food_database f
  cross join prepared p
  where p.needle <> ''
    and f.active is true
    and f.retailer_private_label is false
    and (
      (p.prefix_query is not null and f.search_vector @@ p.prefix_query)
      or f.search_text like '%' || p.needle || '%'
      or f.search_text % p.needle
    )
  order by score desc, f.verified desc, f.popularity desc, f.display_name asc
  limit (select lim from prepared);
$$;

revoke all on table public.food_database from anon, authenticated;
grant select, insert, update on table public.food_database to service_role;

revoke all on function public.search_ari_food_database(text, integer) from public, anon, authenticated;
grant execute on function public.search_ari_food_database(text, integer) to service_role;

notify pgrst, 'reload schema';
