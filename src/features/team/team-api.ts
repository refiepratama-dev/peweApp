import { supabase } from '@/lib/supabase';

export type Member = {
  user_id: string;
  email: string;
  full_name: string;
  role: 'owner' | 'member';
  joined_at: string;
};

function friendly(message: string) {
  if (/list_members|function .* does not exist|Could not find the function/i.test(message)) {
    return 'Fungsi anggota belum ada di database. Jalankan supabase/migrations/003_team_members.sql';
  }
  return message;
}

export async function listMembers(workspaceId: string): Promise<Member[]> {
  const { data, error } = await supabase.rpc('list_members', { ws: workspaceId });
  if (error) throw new Error(friendly(error.message));
  return data as Member[];
}

/** Owner menambah anggota. Email harus sudah daftar akun di Pewe. */
export async function addMember(workspaceId: string, email: string) {
  const { error } = await supabase.rpc('add_member_by_email', { ws: workspaceId, member_email: email });
  if (error) throw new Error(friendly(error.message));
}

/** Owner mengeluarkan anggota, atau anggota keluar sendiri */
export async function removeMember(workspaceId: string, userId: string) {
  const { error } = await supabase
    .from('workspace_members')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId);
  if (error) throw new Error(friendly(error.message));
}
