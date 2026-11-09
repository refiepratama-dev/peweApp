// Versi siap pakai di app: sumber acak dari expo-crypto (CSPRNG native).
import { getRandomBytes } from 'expo-crypto';
import { createVaultCrypto } from './core';

export const vaultCrypto = createVaultCrypto(getRandomBytes);
export { DecryptError, DEFAULT_ITERATIONS, WrongPassphraseError } from './core';
export type { VaultCrypto } from './core';
export { MIN_PASSPHRASE_LENGTH, validatePassphrase } from './passphrase';
