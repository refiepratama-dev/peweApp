// Akses data entry & field. Nilai field dan catatan dienkripsi di HP sebelum dikirim.
import { randomUUID } from 'expo-crypto';
import { vaultCrypto } from '@/lib/crypto';
import { removeStored } from '@/lib/storage/encrypted-storage';
import { supabase } from '@/lib/supabase';
import type { FieldType } from './field-types';

export type EntrySummary = {
  id: string;
  title: string;
  client_name: string | null;
  category_id: string | null;
  updated_at: string;
  field_count: number;
};

export type DecryptedField = {
  id: string;
  label: string;
  type: FieldType;
  is_secret: boolean;
  value: string;
  /** true kalau nilai gagal didekripsi (data rusak / kunci berbeda) */
  error: boolean;
};

export type EntryDetail = {
  id: string;
  title: string;
  client_name: string | null;
  category_id: string | null;
  notes: string;
  notesError: boolean;
  created_at: string;
  updated_at: string;
  fields: DecryptedField[];
};

export type FieldDraft = { id: string; label: string; type: FieldType; is_secret: boolean; value: string };

export type EntryDraft = {
  title: string;
  client_name: string;
  category_id: string | null;
  notes: string;
  fields: FieldDraft[];
};

type SummaryRow = Omit<EntrySummary, 'field_count'> & { fields: { count: number }[] };
type FieldRow = { id: string; label: string; type: FieldType; is_secret: boolean; value_enc: string; order_index: number };
type DetailRow = Omit<EntryDetail, 'notes' | 'notesError' | 'fields'> & { notes_enc: string | null; fields: FieldRow[] };

function tryDecrypt(key: Uint8Array, payload: string): { value: string; error: boolean } {
  try {
    return { value: vaultCrypto.decryptText(key, payload), error: false };
  } catch {
    return { value: '', error: true };
  }
}

export const newFieldId = () => randomUUID();

export async function listEntries(workspaceId: string): Promise<EntrySummary[]> {
  const { data, error } = await supabase
    .from('entries')
    .select('id, title, client_name, category_id, updated_at, fields(count)')
    .eq('workspace_id', workspaceId)
    .order('updated_at', { ascending: false })
    .returns<SummaryRow[]>();
  if (error) throw new Error(error.message);
  return (data ?? []).map(({ fields, ...entry }) => ({ ...entry, field_count: fields?.[0]?.count ?? 0 }));
}

export async function getEntry(id: string, key: Uint8Array): Promise<EntryDetail> {
  const { data, error } = await supabase
    .from('entries')
    .select(
      'id, title, client_name, category_id, notes_enc, created_at, updated_at, fields(id, label, type, is_secret, value_enc, order_index)',
    )
    .eq('id', id)
    .single<DetailRow>();
  if (error) throw new Error(error.message);

  const { notes_enc, fields, ...entry } = data;
  const notes = notes_enc ? tryDecrypt(key, notes_enc) : { value: '', error: false };
  return {
    ...entry,
    notes: notes.value,
    notesError: notes.error,
    fields: [...fields]
      .sort((a, b) => a.order_index - b.order_index)
      .map(({ value_enc, order_index: _order, ...f }) => ({ ...f, ...tryDecrypt(key, value_enc) })),
  };
}

/** Buat (existingId kosong) atau update entry beserta semua field-nya. Mengembalikan id entry. */
export async function saveEntry(
  workspaceId: string,
  key: Uint8Array,
  draft: EntryDraft,
  existingId?: string,
): Promise<string> {
  const id = existingId ?? randomUUID();
  const row = {
    title: draft.title.trim(),
    client_name: draft.client_name.trim() || null,
    category_id: draft.category_id,
    notes_enc: draft.notes.trim() ? vaultCrypto.encryptText(key, draft.notes) : null,
  };

  const entryResult = existingId
    ? await supabase.from('entries').update(row).eq('id', id)
    : await supabase.from('entries').insert({ id, workspace_id: workspaceId, ...row });
  if (entryResult.error) throw new Error(entryResult.error.message);

  // Hapus field yang dibuang dari form
  if (existingId) {
    let del = supabase.from('fields').delete().eq('entry_id', id);
    const keep = draft.fields.map((f) => f.id);
    if (keep.length) del = del.not('id', 'in', `(${keep.join(',')})`);
    const { error } = await del;
    if (error) throw new Error(error.message);
  }

  // Simpan field (insert baru / update lama), urutan mengikuti form
  if (draft.fields.length) {
    const { error } = await supabase.from('fields').upsert(
      draft.fields.map((f, index) => ({
        id: f.id,
        entry_id: id,
        workspace_id: workspaceId,
        label: f.label.trim(),
        type: f.type,
        is_secret: f.is_secret,
        value_enc: vaultCrypto.encryptText(key, f.value),
        order_index: index,
      })),
    );
    if (error) throw new Error(error.message);
  }

  return id;
}

export async function deleteEntry(id: string): Promise<void> {
  // File di Storage tidak ikut terhapus oleh database, jadi dihapus dulu di sini
  const [images, documents] = await Promise.all([
    supabase.from('images').select('storage_path').eq('entry_id', id),
    supabase.from('documents').select('storage_path').eq('entry_id', id),
  ]);
  const paths = [...(images.data ?? []), ...(documents.data ?? [])].map((r) => r.storage_path as string);
  await removeStored(paths);

  // Field, gambar & dokumen (baris database) ikut terhapus lewat ON DELETE CASCADE
  const { error } = await supabase.from('entries').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
