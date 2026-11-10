// Upload / download file terenkripsi ke bucket privat "vault" di Supabase Storage.
import { File, Paths } from 'expo-file-system';
import { randomUUID } from 'expo-crypto';
import { vaultCrypto } from '@/lib/crypto';
import { supabase } from '@/lib/supabase';

const BUCKET = 'vault';

/** Enkripsi lalu upload. Server hanya menerima byte acak (application/octet-stream). */
export async function uploadEncrypted(path: string, key: Uint8Array, data: Uint8Array): Promise<void> {
  const sealed = vaultCrypto.encryptBytes(key, data);
  const body = sealed.buffer.slice(sealed.byteOffset, sealed.byteOffset + sealed.byteLength) as ArrayBuffer;
  const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
    contentType: 'application/octet-stream',
    upsert: false,
  });
  if (error) throw new Error(error.message);
}

/** Download file terenkripsi, dekripsi di memori. File sementara di cache langsung dihapus. */
export async function downloadDecrypted(path: string, key: Uint8Array): Promise<Uint8Array> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60);
  if (error || !data) throw new Error(error?.message ?? 'Gagal membuat link unduhan');

  const temp = new File(Paths.cache, `pewe-${randomUUID()}.enc`);
  try {
    const downloaded = await File.downloadFileAsync(data.signedUrl, temp, { idempotent: true });
    const sealed = await downloaded.bytes();
    return vaultCrypto.decryptBytes(key, sealed);
  } finally {
    try {
      if (temp.exists) temp.delete();
    } catch {
      // abaikan: file sementara akan dibersihkan sistem
    }
  }
}

export async function removeStored(paths: string[]): Promise<void> {
  if (!paths.length) return;
  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) throw new Error(error.message);
}
