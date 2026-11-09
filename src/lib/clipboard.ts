import * as Clipboard from 'expo-clipboard';

const CLEAR_AFTER_MS = 30_000;
let clearTimer: ReturnType<typeof setTimeout> | null = null;

/** Salin ke clipboard. Nilai rahasia dihapus otomatis dari clipboard setelah 30 detik. */
export async function copyToClipboard(value: string, sensitive: boolean) {
  await Clipboard.setStringAsync(value);
  if (clearTimer) clearTimeout(clearTimer);
  clearTimer = sensitive
    ? setTimeout(() => {
        Clipboard.setStringAsync('');
        clearTimer = null;
      }, CLEAR_AFTER_MS)
    : null;
}
