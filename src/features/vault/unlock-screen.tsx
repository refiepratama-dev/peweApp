import { Check, Fingerprint, KeyRound } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthShell } from '@/components/auth-shell';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { WrongPassphraseError } from '@/lib/crypto';
import { useVault } from '@/lib/vault/vault-provider';
import { colors, radius, spacing, typography } from '@/theme';

/** Vault terkunci: buka dengan biometrik (kalau aktif) atau passphrase tim */
export function UnlockScreen() {
  const { workspace, unlock, unlockWithBiometric, biometricAvailable, biometricEnabled, signOutAndForget } =
    useVault();
  const [passphrase, setPassphrase] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Langsung tampilkan prompt sidik jari / Face ID kalau sudah diaktifkan
  useEffect(() => {
    if (biometricEnabled) unlockWithBiometric();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUnlock() {
    if (!passphrase) return setError('Passphrase wajib diisi');
    setError(null);
    setLoading(true);
    try {
      await unlock(passphrase, biometricAvailable && !biometricEnabled && remember);
    } catch (e) {
      setError(e instanceof WrongPassphraseError ? 'Passphrase salah' : 'Gagal membuka vault. Coba lagi');
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Buka vault"
      subtitle={`Masukkan passphrase tim ${workspace?.name ?? ''}.`}
      heroText="Vault terkunci. Data hanya bisa dibuka dengan passphrase tim."
      footer={
        <Button title="Keluar akun" variant="ghost" onPress={signOutAndForget} />
      }
    >
      {biometricEnabled && (
        <Button
          title="Buka dengan biometrik"
          variant="secondary"
          onPress={unlockWithBiometric}
          icon={<Fingerprint size={18} color={colors.textPrimary} />}
        />
      )}

      <TextField
        label="Passphrase tim"
        placeholder="Passphrase tim kamu"
        icon={<KeyRound size={18} color={colors.textSecondary} />}
        value={passphrase}
        onChangeText={setPassphrase}
        error={error}
        secret
        autoComplete="off"
        returnKeyType="go"
        onSubmitEditing={handleUnlock}
      />

      {biometricAvailable && !biometricEnabled && (
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: remember }}
          onPress={() => setRemember((r) => !r)}
          style={styles.checkRow}
        >
          <View style={[styles.checkbox, remember && styles.checkboxOn]}>
            {remember && <Check size={14} color={colors.textOnDark} strokeWidth={3} />}
          </View>
          <Text style={[typography.body, { color: colors.textPrimary, flex: 1 }]}>
            Berikutnya buka pakai sidik jari / Face ID
          </Text>
        </Pressable>
      )}

      <Button
        title={loading ? 'Membuka vault…' : 'Buka vault'}
        loading={loading}
        onPress={handleUnlock}
      />
      {loading && (
        <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center' }]}>
          Proses ini butuh beberapa detik, hanya sekali per HP.
        </Text>
      )}
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm - 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  checkboxOn: { backgroundColor: colors.ink, borderColor: colors.ink },
});
