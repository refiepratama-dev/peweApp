import * as ScreenCapture from 'expo-screen-capture';
import { useEffect } from 'react';
import { Platform } from 'react-native';

const KEY = 'pewe-vault';

/**
 * Saat vault terbuka:
 * - screenshot & rekam layar diblokir (Android: FLAG_SECURE, iOS: hasil rekaman/screenshot hitam)
 * - pratinjau di app switcher diblur (iOS) / kosong (Android, dari FLAG_SECURE)
 */
export function useScreenProtection(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let active = true;

    (async () => {
      try {
        if (!(await ScreenCapture.isAvailableAsync()) || !active) return;
        await ScreenCapture.preventScreenCaptureAsync(KEY);
        if (Platform.OS === 'ios') await ScreenCapture.enableAppSwitcherProtectionAsync(0.9);
      } catch {
        // Tidak didukung di perangkat ini: app tetap jalan tanpa proteksi layar
      }
    })();

    return () => {
      active = false;
      ScreenCapture.allowScreenCaptureAsync(KEY).catch(() => {});
      if (Platform.OS === 'ios') ScreenCapture.disableAppSwitcherProtectionAsync().catch(() => {});
    };
  }, [enabled]);
}
