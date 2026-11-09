// Inti enkripsi Pewe — AES-256-GCM + PBKDF2-SHA256.
// Murni JS (noble), tanpa modul native, sumber acak di-inject supaya bisa dites di Node.
import { gcm } from '@noble/ciphers/aes.js';
import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { base64 } from '@scure/base';

export type RandomBytes = (length: number) => Uint8Array;

const KEY_LENGTH = 32; // 256-bit
const NONCE_LENGTH = 12; // standar GCM
const SALT_LENGTH = 16;
const TEXT_VERSION = 'v1';
const BYTES_VERSION = 1;

/**
 * Iterasi default PBKDF2. Diukur di HP: 150k ≈ 10 dtk (mode production), jadi diturunkan
 * ke 60k (± 4 dtk). Keamanan ditopang passphrase panjang (lihat validatePassphrase).
 * Nilainya disimpan di string kdf_salt, jadi bisa dinaikkan nanti tanpa enkripsi ulang data.
 */
export const DEFAULT_ITERATIONS = 60_000;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export class DecryptError extends Error {
  constructor(message = 'Gagal membuka data: passphrase salah atau data rusak') {
    super(message);
    this.name = 'DecryptError';
  }
}

export class WrongPassphraseError extends DecryptError {
  constructor() {
    super('Passphrase salah');
    this.name = 'WrongPassphraseError';
  }
}

export function createVaultCrypto(randomBytes: RandomBytes) {
  /** Salt baru untuk workspace, format: pbkdf2-sha256$<iterasi>$<salt base64>. */
  function createKdfSalt(iterations = DEFAULT_ITERATIONS): string {
    return `pbkdf2-sha256$${iterations}$${base64.encode(randomBytes(SALT_LENGTH))}`;
  }

  /** Turunkan kunci AES dari passphrase tim + kdf_salt workspace. */
  async function deriveKey(passphrase: string, kdfSalt: string): Promise<Uint8Array> {
    const [algo, iterStr, saltB64] = kdfSalt.split('$');
    const iterations = Number(iterStr);
    if (algo !== 'pbkdf2-sha256' || !Number.isInteger(iterations) || iterations < 1 || !saltB64) {
      throw new Error('Format kdf_salt tidak dikenal');
    }
    return pbkdf2Async(sha256, encoder.encode(passphrase.normalize('NFKC')), base64.decode(saltB64), {
      c: iterations,
      dkLen: KEY_LENGTH,
      // Di React Native tiap jeda (setTimeout) bisa makan ±1 frame. Default noble 10 ms
      // membuat proses 2–3x lebih lambat; 200 ms tetap responsif untuk layar loading.
      asyncTick: 200,
    });
  }

  /** Enkripsi teks → "v1.<nonce>.<ciphertext>" (base64). */
  function encryptText(key: Uint8Array, plaintext: string): string {
    const nonce = randomBytes(NONCE_LENGTH);
    const sealed = gcm(key, nonce).encrypt(encoder.encode(plaintext));
    return `${TEXT_VERSION}.${base64.encode(nonce)}.${base64.encode(sealed)}`;
  }

  function decryptText(key: Uint8Array, payload: string): string {
    const [version, nonceB64, sealedB64] = payload.split('.');
    if (version !== TEXT_VERSION || !nonceB64 || !sealedB64) throw new DecryptError('Format data terenkripsi tidak dikenal');
    try {
      return decoder.decode(gcm(key, base64.decode(nonceB64)).decrypt(base64.decode(sealedB64)));
    } catch {
      throw new DecryptError();
    }
  }

  /** Enkripsi file (gambar/PDF) → [versi 1 byte][nonce 12 byte][ciphertext]. */
  function encryptBytes(key: Uint8Array, data: Uint8Array): Uint8Array {
    const nonce = randomBytes(NONCE_LENGTH);
    const sealed = gcm(key, nonce).encrypt(data);
    const out = new Uint8Array(1 + NONCE_LENGTH + sealed.length);
    out[0] = BYTES_VERSION;
    out.set(nonce, 1);
    out.set(sealed, 1 + NONCE_LENGTH);
    return out;
  }

  function decryptBytes(key: Uint8Array, payload: Uint8Array): Uint8Array {
    if (payload[0] !== BYTES_VERSION || payload.length < 1 + NONCE_LENGTH + 16) {
      throw new DecryptError('Format file terenkripsi tidak dikenal');
    }
    try {
      return gcm(key, payload.subarray(1, 1 + NONCE_LENGTH)).decrypt(payload.subarray(1 + NONCE_LENGTH));
    } catch {
      throw new DecryptError();
    }
  }

  // ---------- KEY WRAPPING ----------
  // Data dienkripsi dengan "data key" acak (DEK). DEK dibungkus (wrap) memakai kunci dari
  // passphrase tim (KEK), lalu hasilnya disimpan di kolom workspaces.wrapped_key.
  // Untung-nya: ganti passphrase / naikkan iterasi cukup bungkus ulang DEK,
  // tanpa harus enkripsi ulang semua field, gambar & PDF.

  function wrapKey(kek: Uint8Array, dataKey: Uint8Array): string {
    return encryptText(kek, base64.encode(dataKey));
  }

  /** Dipakai saat membuat workspace baru. Simpan kdfSalt + wrappedKey ke tabel workspaces. */
  async function createWorkspaceKeys(passphrase: string) {
    const kdfSalt = createKdfSalt();
    const kek = await deriveKey(passphrase, kdfSalt);
    const dataKey = randomBytes(KEY_LENGTH);
    return { kdfSalt, wrappedKey: wrapKey(kek, dataKey), dataKey };
  }

  /** Buka vault: passphrase → DEK. Melempar WrongPassphraseError kalau passphrase salah. */
  async function unlockDataKey(passphrase: string, kdfSalt: string, wrappedKey: string): Promise<Uint8Array> {
    const kek = await deriveKey(passphrase, kdfSalt);
    try {
      const dataKey = base64.decode(decryptText(kek, wrappedKey));
      if (dataKey.length !== KEY_LENGTH) throw new Error('panjang kunci salah');
      return dataKey;
    } catch {
      throw new WrongPassphraseError();
    }
  }

  /** Ganti passphrase tim (mis. ada anggota keluar). Data lama tetap bisa dibuka. */
  async function rewrapDataKey(dataKey: Uint8Array, newPassphrase: string, iterations = DEFAULT_ITERATIONS) {
    const kdfSalt = createKdfSalt(iterations);
    const kek = await deriveKey(newPassphrase, kdfSalt);
    return { kdfSalt, wrappedKey: wrapKey(kek, dataKey) };
  }

  return {
    createKdfSalt,
    deriveKey,
    encryptText,
    decryptText,
    encryptBytes,
    decryptBytes,
    createWorkspaceKeys,
    unlockDataKey,
    rewrapDataKey,
  };
}

export type VaultCrypto = ReturnType<typeof createVaultCrypto>;
