// Dokumen (PDF) per entry: dienkripsi di HP lalu disimpan di Storage.
import { randomUUID } from 'expo-crypto';
import { File } from 'expo-file-system';
import { writeDecryptedFile } from '@/lib/storage/decrypted-files';
import { downloadDecrypted, removeStored, uploadEncrypted } from '@/lib/storage/encrypted-storage';
import { supabase } from '@/lib/supabase';

export type VaultDocument = {
  id: string;
  entry_id: string;
  workspace_id: string;
  name: string;
  storage_path: string;
  mime_type: string;
  size: number | null;
  order_index: number;
  created_at: string;
};

/** Batas ukuran per file (enkripsi berjalan di memori HP) */
export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;

export function formatSize(bytes: number | null | undefined): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export async function listDocuments(entryId: string): Promise<VaultDocument[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('entry_id', entryId)
    .order('order_index')
    .order('created_at');
  if (error) throw new Error(error.message);
  return data as VaultDocument[];
}

type UploadParams = {
  workspaceId: string;
  entryId: string;
  key: Uint8Array;
  uri: string;
  name: string;
  mimeType: string;
  orderIndex: number;
};

export async function uploadDocument({ workspaceId, entryId, key, uri, name, mimeType, orderIndex }: UploadParams) {
  const bytes = await new File(uri).bytes();
  if (bytes.length > MAX_DOCUMENT_BYTES) throw new Error(`Ukuran maksimal ${formatSize(MAX_DOCUMENT_BYTES)}`);

  const id = randomUUID();
  const storage_path = `${workspaceId}/${entryId}/docs/${id}.enc`;
  await uploadEncrypted(storage_path, key, bytes);

  const row = {
    id,
    entry_id: entryId,
    workspace_id: workspaceId,
    name,
    storage_path,
    mime_type: mimeType,
    size: bytes.length,
    order_index: orderIndex,
  };
  const { data, error } = await supabase.from('documents').insert(row).select().single<VaultDocument>();
  if (error) {
    await removeStored([storage_path]).catch(() => {});
    throw new Error(error.message);
  }
  return data;
}

/** Dekripsi ke file sementara (dengan nama asli) untuk dibuka / dibagikan */
export async function openDocumentFile(doc: VaultDocument, key: Uint8Array): Promise<File> {
  const bytes = await downloadDecrypted(doc.storage_path, key);
  const fileName = /\.pdf$/i.test(doc.name) || doc.mime_type !== 'application/pdf' ? doc.name : `${doc.name}.pdf`;
  return writeDecryptedFile(doc.id, fileName, bytes);
}

export async function renameDocument(id: string, name: string) {
  const { error } = await supabase.from('documents').update({ name }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteDocument(doc: VaultDocument) {
  await removeStored([doc.storage_path]);
  const { error } = await supabase.from('documents').delete().eq('id', doc.id);
  if (error) throw new Error(error.message);
}
