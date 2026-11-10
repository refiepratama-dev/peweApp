import * as Updates from 'expo-updates';
import { useEffect } from 'react';
import { Alert } from 'react-native';

/**
 * Di APK (bukan Expo Go / mode dev): cek update OTA saat app dibuka.
 * Kalau ada, unduh di latar belakang lalu tawarkan untuk memuat ulang.
 */
export function useOtaUpdate() {
  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;

    (async () => {
      try {
        const check = await Updates.checkForUpdateAsync();
        if (!check.isAvailable) return;
        const result = await Updates.fetchUpdateAsync();
        if (!result.isNew) return;
        Alert.alert('Update tersedia', 'Versi baru Pewe sudah diunduh. Muat ulang sekarang?', [
          { text: 'Nanti', style: 'cancel' },
          { text: 'Muat ulang', onPress: () => Updates.reloadAsync() },
        ]);
      } catch {
        // Offline / server update tidak terjangkau: pakai versi yang ada
      }
    })();
  }, []);
}
