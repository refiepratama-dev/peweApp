// Aturan passphrase tim. Karena iterasi PBKDF2 diturunkan demi kecepatan di HP,
// kekuatan vault bertumpu pada passphrase yang panjang.

export const MIN_PASSPHRASE_LENGTH = 12;

export type PassphraseCheck = { ok: true } | { ok: false; message: string };

export function validatePassphrase(passphrase: string): PassphraseCheck {
  const p = passphrase.trim();

  if (p.length < MIN_PASSPHRASE_LENGTH) {
    return { ok: false, message: `Minimal ${MIN_PASSPHRASE_LENGTH} karakter` };
  }
  if (new Set(p.toLowerCase()).size < 6) {
    return { ok: false, message: 'Terlalu banyak karakter yang berulang' };
  }

  const kinds = [/[a-zA-Z]/, /\d/, /[^a-zA-Z\d]/].filter((re) => re.test(p)).length;
  const words = p.split(/\s+/).filter(Boolean).length;
  // Lolos kalau campuran ≥ 2 jenis karakter, atau kalimat ≥ 3 kata (contoh: "kopi pagi palembang")
  if (kinds < 2 && words < 3) {
    return { ok: false, message: 'Campur huruf + angka/simbol, atau pakai kalimat minimal 3 kata' };
  }

  return { ok: true };
}
