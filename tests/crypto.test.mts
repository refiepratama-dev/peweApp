import { randomBytes } from 'node:crypto';
import { createVaultCrypto, DecryptError, WrongPassphraseError } from '../src/lib/crypto/core.ts';

const c = createVaultCrypto((n) => new Uint8Array(randomBytes(n)));
const assert = (ok: unknown, m: string) => {
  if (!ok) throw new Error('FAIL ' + m);
  console.log('ok', m);
};
const throws = async (fn: () => unknown, cls: Function) => {
  try { await fn(); return false; } catch (e) { return e instanceof cls; }
};
const same = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((x, i) => x === b[i]);

// Workspace baru + buka vault
const t = Date.now();
const ws = await c.createWorkspaceKeys('rahasia tim pewe 2026');
console.log('derive ms (node)', Date.now() - t, ws.kdfSalt);
const unlocked = await c.unlockDataKey('rahasia tim pewe 2026', ws.kdfSalt, ws.wrappedKey);
assert(same(unlocked, ws.dataKey), 'passphrase benar → data key sama');
assert(await throws(() => c.unlockDataKey('salah', ws.kdfSalt, ws.wrappedKey), WrongPassphraseError), 'passphrase salah → WrongPassphraseError');

// Enkripsi teks
const key = ws.dataKey;
const enc = c.encryptText(key, 'Password DB: p@ss 🔑');
assert(c.decryptText(key, enc) === 'Password DB: p@ss 🔑', 'teks round-trip (+emoji)');
assert(c.encryptText(key, 'x') !== c.encryptText(key, 'x'), 'nonce acak tiap enkripsi');
const otherKey = new Uint8Array(randomBytes(32));
assert(await throws(() => c.decryptText(otherKey, enc), DecryptError), 'kunci salah → DecryptError');
const tampered = enc.slice(0, -4) + (enc.endsWith('AAAA') ? 'BBBB' : 'AAAA');
assert(await throws(() => c.decryptText(key, tampered), DecryptError), 'data diubah → ditolak');

// Enkripsi file
const file = new Uint8Array(randomBytes(200_000));
assert(same(c.decryptBytes(key, c.encryptBytes(key, file)), file), 'file 200KB round-trip');

// Ganti passphrase: data lama tetap terbuka
const rew = await c.rewrapDataKey(key, 'passphrase baru tim 99');
const reopened = await c.unlockDataKey('passphrase baru tim 99', rew.kdfSalt, rew.wrappedKey);
assert(c.decryptText(reopened, enc) === 'Password DB: p@ss 🔑', 'ganti passphrase → data lama tetap terbuka');
assert(await throws(() => c.unlockDataKey('rahasia tim pewe 2026', rew.kdfSalt, rew.wrappedKey), WrongPassphraseError), 'passphrase lama ditolak setelah diganti');
