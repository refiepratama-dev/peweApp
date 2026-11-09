// Versi siap pakai di app: sumber acak dari expo-crypto (CSPRNG native).
import { getRandomBytes } from 'expo-crypto';
import { createVaultCrypto } from './core';

export const vaultCrypto = createVaultCrypto(getRandomBytes);
export { DecryptError, DEFAULT_ITERATIONS } from './core';
export type { VaultCrypto } from './core';
