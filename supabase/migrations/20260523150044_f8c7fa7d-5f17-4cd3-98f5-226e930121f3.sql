
-- Enums
create type public.app_role as enum ('admin', 'user');
create type public.user_status as enum ('active', 'banned');

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  status public.user_status not null default 'active',
  created_at timestamptz not null default now(),
  last_login_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- User roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

-- has_role function (security definer to avoid recursive RLS)
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_admin(_user_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.has_role(_user_id, 'admin')
$$;

-- RLS: profiles
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth.uid() = id);
create policy "profiles_select_admin" on public.profiles
  for select to authenticated using (public.is_admin(auth.uid()));
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id);
create policy "profiles_update_admin" on public.profiles
  for update to authenticated using (public.is_admin(auth.uid()));
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

-- RLS: user_roles (admin-only read/write)
create policy "user_roles_select_admin" on public.user_roles
  for select to authenticated using (public.is_admin(auth.uid()));
create policy "user_roles_select_self" on public.user_roles
  for select to authenticated using (user_id = auth.uid());
create policy "user_roles_all_admin" on public.user_roles
  for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Admin email whitelist
create or replace function public.is_admin_email(_email text)
returns boolean language sql immutable as $$
  select lower(_email) = any (array[
    'danielsamsunglee@gmail.com',
    'edmondsamsunglee03@gmail.com',
    'happyhondacity03@gmail.com',
    'smartfunneldesign@gmail.com',
    'staylearning08@gmail.com',
    'staylearning03@gmail.com',
    'qloversholdings@gmail.com'
  ])
$$;

-- Trigger: on signup, create profile + assign admin role if whitelisted
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
        last_login_at = now();

  if public.is_admin_email(new.email) then
    insert into public.user_roles (user_id, role) values (new.id, 'admin')
    on conflict (user_id, role) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
