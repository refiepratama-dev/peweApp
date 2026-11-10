// Gambar per entry: dikompres di HP, dienkripsi, lalu disimpan di Storage.
import { base64 } from '@scure/base';
import { randomUUID } from 'expo-crypto';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { downloadDecrypted, removeStored, uploadEncrypted } from '@/lib/storage/encrypted-storage';
import { supabase } from '@/lib/supabase';

export type VaultImage = {
  id: string;
  entry_id: string;
  workspace_id: string;
  name: string;
  storage_path: string;
  width: number | null;
  height: number | null;
  order_index: number;
  created_at: string;
};

/** Sisi terpanjang gambar setelah dikompres (cukup tajam untuk screenshot / foto dokumen) */
const MAX_SIDE = 2048;

// Cache gambar yang sudah didekripsi, hanya di memori (tidak ditulis ke disk).
const decrypted = new Map<string, string>();

export function clearImageCache() {
  decrypted.clear();
}

export async function listImages(entryId: string): Promise<VaultImage[]> {
  const { data, error } = await supabase
    .from('images')
    .select('*')
    .eq('entry_id', entryId)
    .order('order_index')
    .order('created_at');
  if (error) throw new Error(error.message);
  return data as VaultImage[];
}

type UploadParams = {
  workspaceId: string;
  entryId: string;
  key: Uint8Array;
  uri: string;
  name: string;
  orderIndex: number;
};

export async function uploadImage({ workspaceId, entryId, key, uri, name, orderIndex }: UploadParams) {
  // 1. Kecilkan & kompres (JPEG) supaya hemat kuota Storage
  const rendered = await ImageManipulator.manipulate(uri, { maxWidth: MAX_SIDE, maxHeight: MAX_SIDE }).renderAsync();
  const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.8, base64: true });
  if (!saved.base64) throw new Error('Gagal memproses gambar');

  // 2. Enkripsi + upload
  const id = randomUUID();
  const storage_path = `${workspaceId}/${entryId}/images/${id}.enc`;
  await uploadEncrypted(storage_path, key, base64.decode(saved.base64));

  // 3. Simpan metadata
  const row = {
    id,
    entry_id: entryId,
    workspace_id: workspaceId,
    name,
    storage_path,
    width: saved.width,
    height: saved.height,
    order_index: orderIndex,
  };
  const { data, error } = await supabase.from('images').insert(row).select().single<VaultImage>();
  if (error) {
    await removeStored([storage_path]).catch(() => {});
    throw new Error(error.message);
  }
  decrypted.set(id, `data:image/jpeg;base64,${saved.base64}`);
  return data;
}

/** Data URI gambar yang sudah didekripsi (diambil dari cache memori kalau ada) */
export async function loadImage(image: VaultImage, key: Uint8Array): Promise<string> {
  const cached = decrypted.get(image.id);
  if (cached) return cached;
  const bytes = await downloadDecrypted(image.storage_path, key);
  const uri = `data:image/jpeg;base64,${base64.encode(bytes)}`;
  decrypted.set(image.id, uri);
  return uri;
}

export async function renameImage(id: string, name: string) {
  const { error } = await supabase.from('images').update({ name }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteImage(image: VaultImage) {
  await removeStored([image.storage_path]);
  const { error } = await supabase.from('images').delete().eq('id', image.id);
  if (error) throw new Error(error.message);
  decrypted.delete(image.id);
}
