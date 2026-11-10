// File hasil dekripsi yang perlu dibuka app lain (preview PDF / share) harus ada di disk.
// Semuanya ditaruh di satu folder cache dan dihapus saat vault dikunci / keluar / app dibuka.
import { Directory, File, Paths } from 'expo-file-system';

const ROOT = 'pewe-open';

const safeName = (name: string) => name.replace(/[\\/:*?"<>|]+/g, '_').trim() || 'dokumen';

/** Tulis byte ke cache dengan nama file asli (supaya nama terlihat saat preview / share) */
export async function writeDecryptedFile(id: string, fileName: string, bytes: Uint8Array): Promise<File> {
  const dir = new Directory(Paths.cache, ROOT, id);
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  const file = new File(dir, safeName(fileName));
  if (file.exists) file.delete();
  file.create();
  await file.write(bytes);
  return file;
}

export function clearDecryptedFiles() {
  try {
    const dir = new Directory(Paths.cache, ROOT);
    if (dir.exists) dir.delete();
  } catch {
    // abaikan: cache akan dibersihkan sistem
  }
}
