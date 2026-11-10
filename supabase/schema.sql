-- =========================================================
-- Pewe — Skema Supabase (Tahap: database + RLS + storage)
-- Jalankan sekali di Supabase Dashboard → SQL Editor → Run
-- Catatan: kolom *_enc berisi data TERENKRIPSI dari HP (AES-GCM).
-- Server tidak pernah menyimpan passphrase / kunci.
-- =========================================================

-- ---------- 1. WORKSPACE (tim) ----------
create table public.workspaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  kdf_salt    text not null,          -- salt untuk menurunkan kunci dari passphrase
  wrapped_key text not null,          -- data key (DEK) terbungkus kunci dari passphrase tim
  created_by  uuid not null default auth.uid() references auth.users(id),
  created_at  timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         text not null default 'member' check (role in ('owner','member')),
  joined_at    timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

-- ---------- 2. KATEGORI ----------
create table public.categories (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name         text not null,
  color        text not null default '#6366F1',
  icon         text not null default 'folder',
  created_at   timestamptz not null default now(),
  unique (id, workspace_id)
);

-- ---------- 3. ENTRY (kartu klien/akun) ----------
create table public.entries (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  category_id  uuid,
  title        text not null,
  client_name  text,
  notes_enc    text,                  -- catatan terenkripsi (opsional)
  created_by   uuid default auth.uid() references auth.users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (id, workspace_id),
  foreign key (category_id, workspace_id)
    references public.categories(id, workspace_id)
    on delete set null (category_id)
);

-- ---------- 4. FIELD custom ----------
create table public.fields (
  id           uuid primary key default gen_random_uuid(),
  entry_id     uuid not null,
  workspace_id uuid not null,
  label        text not null,         -- contoh: "Password Supabase"
  type         text not null default 'text'
               check (type in ('text','email','password','url','key','note')),
  is_secret    boolean not null default false,
  value_enc    text not null,         -- nilai selalu terenkripsi
  order_index  int not null default 0,
  created_at   timestamptz not null default now(),
  foreign key (entry_id, workspace_id)
    references public.entries(id, workspace_id) on delete cascade
);

-- ---------- 5. GAMBAR ----------
create table public.images (
  id           uuid primary key default gen_random_uuid(),
  entry_id     uuid not null,
  workspace_id uuid not null,
  name         text not null,
  storage_path text not null,         -- {workspace_id}/{entry_id}/images/{file}.enc
  width        int,
  height       int,
  order_index  int not null default 0,
  created_at   timestamptz not null default now(),
  foreign key (entry_id, workspace_id)
    references public.entries(id, workspace_id) on delete cascade
);

-- ---------- 6. DOKUMEN (PDF) ----------
create table public.documents (
  id           uuid primary key default gen_random_uuid(),
  entry_id     uuid not null,
  workspace_id uuid not null,
  name         text not null,
  storage_path text not null,         -- {workspace_id}/{entry_id}/docs/{file}.enc
  mime_type    text not null default 'application/pdf',
  size         bigint,
  order_index  int not null default 0,
  created_at   timestamptz not null default now(),
  foreign key (entry_id, workspace_id)
    references public.entries(id, workspace_id) on delete cascade
);

-- ---------- 7. INDEX ----------
create index on public.workspace_members (user_id);
create index on public.entries (workspace_id, updated_at desc);
create index on public.fields (entry_id, order_index);
create index on public.images (entry_id, order_index);
create index on public.documents (entry_id, order_index);

-- =========================================================
-- FUNGSI BANTUAN
-- =========================================================

-- Cek apakah user login adalah anggota workspace
create or replace function public.is_member(ws uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws and user_id = auth.uid()
  );
$$;

-- Cek apakah user login adalah owner workspace
create or replace function public.is_owner(ws uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws and user_id = auth.uid() and role = 'owner'
  );
$$;

-- Pembuat workspace otomatis jadi owner
create or replace function public.add_creator_as_owner()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  return new;
end;
$$;

create trigger trg_workspace_owner
after insert on public.workspaces
for each row execute function public.add_creator_as_owner();

-- Owner menambah teman via email (teman harus sudah daftar akun di app)
create or replace function public.add_member_by_email(ws uuid, member_email text)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  if not public.is_owner(ws) then
    raise exception 'Hanya owner yang bisa menambah anggota';
  end if;
  select id into uid from auth.users where lower(email) = lower(member_email);
  if uid is null then
    raise exception 'Email belum terdaftar di aplikasi';
  end if;
  insert into public.workspace_members (workspace_id, user_id, role)
  values (ws, uid, 'member')
  on conflict do nothing;
end;
$$;

-- Daftar anggota tim (email & nama dari auth.users)
create or replace function public.list_members(ws uuid)
returns table (user_id uuid, email text, full_name text, role text, joined_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_member(ws) then
    raise exception 'Bukan anggota tim ini';
  end if;
  return query
    select m.user_id,
           u.email::text,
           coalesce(u.raw_user_meta_data ->> 'full_name', '')::text,
           m.role,
           m.joined_at
    from public.workspace_members m
    join auth.users u on u.id = m.user_id
    where m.workspace_id = ws
    order by (m.role = 'owner') desc, m.joined_at;
end;
$$;

-- Owner tidak boleh keluar / dikeluarkan (tim jadi tanpa owner)
create or replace function public.prevent_owner_removal()
returns trigger language plpgsql as $$
begin
  if old.role = 'owner' and exists (select 1 from public.workspaces w where w.id = old.workspace_id) then
    raise exception 'Owner tidak bisa keluar dari tim';
  end if;
  return old;
end;
$$;

drop trigger if exists trg_prevent_owner_removal on public.workspace_members;
create trigger trg_prevent_owner_removal
before delete on public.workspace_members
for each row execute function public.prevent_owner_removal();

-- updated_at otomatis
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger trg_entries_updated
before update on public.entries
for each row execute function public.touch_updated_at();

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
alter table public.workspaces        enable row level security;
alter table public.workspace_members enable row level security;
alter table public.categories        enable row level security;
alter table public.entries           enable row level security;
alter table public.fields            enable row level security;
alter table public.images            enable row level security;
alter table public.documents         enable row level security;

-- Workspaces
create policy ws_select on public.workspaces for select using (public.is_member(id));
create policy ws_insert on public.workspaces for insert with check (created_by = auth.uid());
create policy ws_update on public.workspaces for update using (public.is_owner(id));
create policy ws_delete on public.workspaces for delete using (public.is_owner(id));

-- Anggota
create policy wm_select on public.workspace_members for select using (public.is_member(workspace_id));
create policy wm_delete on public.workspace_members for delete
  using (public.is_owner(workspace_id) or user_id = auth.uid());   -- owner kick / keluar sendiri

-- Tabel data: semua anggota boleh CRUD
create policy cat_all on public.categories for all
  using (public.is_member(workspace_id)) with check (public.is_member(workspace_id));
create policy ent_all on public.entries for all
  using (public.is_member(workspace_id)) with check (public.is_member(workspace_id));
create policy fld_all on public.fields for all
  using (public.is_member(workspace_id)) with check (public.is_member(workspace_id));
create policy img_all on public.images for all
  using (public.is_member(workspace_id)) with check (public.is_member(workspace_id));
create policy doc_all on public.documents for all
  using (public.is_member(workspace_id)) with check (public.is_member(workspace_id));

-- =========================================================
-- STORAGE (bucket private untuk gambar & PDF terenkripsi)
-- =========================================================
insert into storage.buckets (id, name, public)
values ('vault', 'vault', false)
on conflict (id) do nothing;

-- Folder pertama path = workspace_id
create policy vault_select on storage.objects for select
  using (bucket_id = 'vault' and public.is_member(((storage.foldername(name))[1])::uuid));
create policy vault_insert on storage.objects for insert
  with check (bucket_id = 'vault' and public.is_member(((storage.foldername(name))[1])::uuid));
create policy vault_update on storage.objects for update
  using (bucket_id = 'vault' and public.is_member(((storage.foldername(name))[1])::uuid));
create policy vault_delete on storage.objects for delete
  using (bucket_id = 'vault' and public.is_member(((storage.foldername(name))[1])::uuid));
