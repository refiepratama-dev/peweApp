// Simpan data key (DEK) di Keychain / Keystore, dikunci biometrik.
// Jadi passphrase cukup diketik sekali per HP; berikutnya buka vault pakai sidik jari / Face ID.
import { base64 } from '@scure/base';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const PROMPT = 'Buka vault Pewe';

/**
 * Dua mode penyimpanan:
 * - "hw"  : Keychain/Keystore yang mewajibkan biometrik di level sistem (APK / build asli).
 * - "app" : Keychain biasa (hanya di HP ini), dibuka setelah LocalAuthentication sukses.
 *           Dipakai di Expo Go, karena Expo Go (iOS) tidak punya izin Face ID untuk mode "hw".
 * Mode yang dipakai dicatat di flag, supaya saat membaca memakai cara yang sama.
 */
type Mode = 'hw' | 'app';

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  // fallback untuk versi Expo Go yang belum mengisi executionEnvironment dengan benar
  (Constants as { appOwnership?: string | null }).appOwnership === 'expo';

const isMissingFaceIdPermission = (e: unknown) =>
  e instanceof Error && /NSFaceIDUsageDescription|requireAuthentication/i.test(e.message);

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

async function getMode(workspaceId: string): Promise<Mode | null> {
  const flag = await SecureStore.getItemAsync(flagKey(workspaceId));
  if (flag === 'app') return 'app';
  if (flag === 'hw' || flag === '1') return 'hw';
  return null;
}

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
  return (await getMode(workspaceId)) !== null;
}

async function saveAppGated(workspaceId: string, value: string) {
  if (!(await authenticate())) throw new Error('Verifikasi biometrik dibatalkan');
  await SecureStore.setItemAsync(dekKey(workspaceId), value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  await SecureStore.setItemAsync(flagKey(workspaceId), 'app');
}

export async function saveDataKey(workspaceId: string, dataKey: Uint8Array): Promise<void> {
  const value = base64.encode(dataKey);
  if (isExpoGo) return saveAppGated(workspaceId, value);

  try {
    await SecureStore.setItemAsync(dekKey(workspaceId), value, {
      requireAuthentication: true,
      authenticationPrompt: PROMPT,
      keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
    });
    await SecureStore.setItemAsync(flagKey(workspaceId), 'hw');
  } catch (e) {
    // Lingkungan tanpa izin Face ID (mis. Expo Go) → pakai mode "app"
    if (isMissingFaceIdPermission(e)) return saveAppGated(workspaceId, value);
    throw e;
  }
}

/**
 * Ambil DEK (memunculkan prompt biometrik).
 * null = dibatalkan / gagal / kunci di-reset sistem (mis. sidik jari baru ditambahkan).
 */
export async function loadDataKey(workspaceId: string): Promise<Uint8Array | null> {
  try {
    const mode = await getMode(workspaceId);
    if (!mode) return null;
    if (mode === 'app' && !(await authenticate())) return null;

    const value = await SecureStore.getItemAsync(
      dekKey(workspaceId),
      mode === 'hw' ? { requireAuthentication: true, authenticationPrompt: PROMPT } : undefined,
    );
    if (!value) {
      // Kunci di-invalidate sistem → matikan flag supaya user diminta passphrase lagi
      await SecureStore.deleteItemAsync(flagKey(workspaceId));
      return null;
    }
    return base64.decode(value);
  } catch (e) {
    // Data lama tersimpan mode "hw" tapi lingkungan tidak mendukung → reset, minta passphrase
    if (isMissingFaceIdPermission(e)) await clearDataKey(workspaceId);
    return null;
  }
}

export async function clearDataKey(workspaceId: string): Promise<void> {
  await SecureStore.deleteItemAsync(dekKey(workspaceId));
  await SecureStore.deleteItemAsync(flagKey(workspaceId));
}
