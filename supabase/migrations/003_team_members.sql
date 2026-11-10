-- Pewe — migrasi 003: daftar anggota tim
-- Email & nama ada di auth.users yang tidak bisa dibaca langsung dari app,
-- jadi dibuat fungsi security definer yang hanya bisa dipanggil anggota tim itu sendiri.
-- Jalankan sekali di Supabase → SQL Editor.

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
