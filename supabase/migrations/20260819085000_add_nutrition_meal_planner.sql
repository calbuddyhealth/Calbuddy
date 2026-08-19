create table if not exists public.nutrition_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  servings numeric not null default 1 check (servings > 0),
  calories_per_serving numeric not null default 0 check (calories_per_serving >= 0),
  protein_g_per_serving numeric not null default 0 check (protein_g_per_serving >= 0),
  carbs_g_per_serving numeric not null default 0 check (carbs_g_per_serving >= 0),
  fat_g_per_serving numeric not null default 0 check (fat_g_per_serving >= 0),
  ingredients jsonb not null default '[]'::jsonb,
  instructions jsonb not null default '[]'::jsonb,
  source_type text not null default 'manual' check (source_type in ('manual','ari')),
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists nutrition_recipes_user_updated_idx
  on public.nutrition_recipes(user_id, updated_at desc);

alter table public.nutrition_recipes enable row level security;

drop policy if exists nutrition_recipes_select_own on public.nutrition_recipes;
create policy nutrition_recipes_select_own on public.nutrition_recipes
  for select using (auth.uid() = user_id);

drop policy if exists nutrition_recipes_insert_own on public.nutrition_recipes;
create policy nutrition_recipes_insert_own on public.nutrition_recipes
  for insert with check (auth.uid() = user_id);

drop policy if exists nutrition_recipes_update_own on public.nutrition_recipes;
create policy nutrition_recipes_update_own on public.nutrition_recipes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists nutrition_recipes_delete_own on public.nutrition_recipes;
create policy nutrition_recipes_delete_own on public.nutrition_recipes
  for delete using (auth.uid() = user_id);

create table if not exists public.nutrition_plan_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_date date not null,
  meal_slot text not null check (meal_slot in ('breakfast','lunch','dinner','snack')),
  name text not null,
  calories numeric not null default 0 check (calories >= 0),
  protein_g numeric not null default 0 check (protein_g >= 0),
  carbs_g numeric not null default 0 check (carbs_g >= 0),
  fat_g numeric not null default 0 check (fat_g >= 0),
  serving_size text not null default 'Planned serving',
  multiplier numeric not null default 1 check (multiplier > 0),
  source_type text not null default 'manual' check (source_type in ('manual','recent','saved_meal','recipe','ari')),
  source_ref text,
  recipe_id uuid references public.nutrition_recipes(id) on delete set null,
  items jsonb not null default '[]'::jsonb,
  notes text not null default '',
  status text not null default 'planned' check (status in ('planned','eaten','skipped')),
  consumed_meal_id text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists nutrition_plan_items_user_date_idx
  on public.nutrition_plan_items(user_id, plan_date, meal_slot, position, created_at);

alter table public.nutrition_plan_items enable row level security;

drop policy if exists nutrition_plan_items_select_own on public.nutrition_plan_items;
create policy nutrition_plan_items_select_own on public.nutrition_plan_items
  for select using (auth.uid() = user_id);

drop policy if exists nutrition_plan_items_insert_own on public.nutrition_plan_items;
create policy nutrition_plan_items_insert_own on public.nutrition_plan_items
  for insert with check (auth.uid() = user_id);

drop policy if exists nutrition_plan_items_update_own on public.nutrition_plan_items;
create policy nutrition_plan_items_update_own on public.nutrition_plan_items
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists nutrition_plan_items_delete_own on public.nutrition_plan_items;
create policy nutrition_plan_items_delete_own on public.nutrition_plan_items
  for delete using (auth.uid() = user_id);

create table if not exists public.nutrition_plan_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  template jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists nutrition_plan_templates_user_updated_idx
  on public.nutrition_plan_templates(user_id, updated_at desc);

alter table public.nutrition_plan_templates enable row level security;

drop policy if exists nutrition_plan_templates_select_own on public.nutrition_plan_templates;
create policy nutrition_plan_templates_select_own on public.nutrition_plan_templates
  for select using (auth.uid() = user_id);

drop policy if exists nutrition_plan_templates_insert_own on public.nutrition_plan_templates;
create policy nutrition_plan_templates_insert_own on public.nutrition_plan_templates
  for insert with check (auth.uid() = user_id);

drop policy if exists nutrition_plan_templates_update_own on public.nutrition_plan_templates;
create policy nutrition_plan_templates_update_own on public.nutrition_plan_templates
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists nutrition_plan_templates_delete_own on public.nutrition_plan_templates;
create policy nutrition_plan_templates_delete_own on public.nutrition_plan_templates
  for delete using (auth.uid() = user_id);