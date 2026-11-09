// Simpan data key (DEK) di Keychain / Keystore, dikunci biometrik.
// Jadi passphrase cukup diketik sekali per HP; berikutnya buka vault pakai sidik jari / Face ID.
import { base64 } from '@scure/base';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const PROMPT = 'Buka vault Pewe';

/**
 * Expo Go (iOS) tidak punya izin Face ID untuk SecureStore `requireAuthentication`.
 * Di Expo Go: kunci disimpan di Keychain biasa (hanya di HP ini) dan dibuka setelah
 * LocalAuthentication sukses. Di APK / build asli: Keychain/Keystore yang mewajibkan biometrik.
 */
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

async function authenticate(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: PROMPT,
    cancelLabel: 'Batal',
  });
  return result.success;
}

// Key SecureStore hanya boleh huruf, angka, ".", "-", "_"
const dekKey = (workspaceId: string) => `pewe_dek_${workspaceId.replace(/[^a-zA-Z0-9]/g, '')}`;
const flagKey = (workspaceId: string) => `${dekKey(workspaceId)}_enabled`;

/** HP punya sensor biometrik DAN sudah ada sidik jari / wajah yang terdaftar */
export async function canUseBiometric(): Promise<boolean> {
  try {
    return (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
  } catch {
    return false;
  }
}

/** Apakah biometrik sudah diaktifkan untuk workspace ini di HP ini (tanpa memicu prompt) */
export async function isBiometricEnabled(workspaceId: string): Promise<boolean> {
  return (await SecureStore.getItemAsync(flagKey(workspaceId))) === '1';
}

export async function saveDataKey(workspaceId: string, dataKey: Uint8Array): Promise<void> {
  if (isExpoGo) {
    if (!(await authenticate())) throw new Error('Verifikasi biometrik dibatalkan');
    await SecureStore.setItemAsync(dekKey(workspaceId), base64.encode(dataKey), {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } else {
    await SecureStore.setItemAsync(dekKey(workspaceId), base64.encode(dataKey), {
      requireAuthentication: true,
      authenticationPrompt: PROMPT,
      keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
    });
  }
  await SecureStore.setItemAsync(flagKey(workspaceId), '1');
}

/**
 * Ambil DEK (memunculkan prompt biometrik).
 * null = dibatalkan / gagal / kunci di-reset sistem (mis. sidik jari baru ditambahkan).
 */
export async function loadDataKey(workspaceId: string): Promise<Uint8Array | null> {
  try {
    if (isExpoGo && !(await authenticate())) return null;
    const value = await SecureStore.getItemAsync(
      dekKey(workspaceId),
      isExpoGo ? undefined : { requireAuthentication: true, authenticationPrompt: PROMPT },
    );
    if (!value) {
      // Kunci di-invalidate sistem → matikan flag supaya user diminta passphrase lagi
      await SecureStore.deleteItemAsync(flagKey(workspaceId));
      return null;
    }
    return base64.decode(value);
  } catch {
    return null;
  }
}

export async function clearDataKey(workspaceId: string): Promise<void> {
  await SecureStore.deleteItemAsync(dekKey(workspaceId));
  await SecureStore.deleteItemAsync(flagKey(workspaceId));
}
