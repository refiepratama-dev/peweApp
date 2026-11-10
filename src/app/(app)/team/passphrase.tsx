import { router } from 'expo-router';
import { KeyRound } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PassphraseStrength } from '@/components/passphrase-strength';
import { Button } from '@/components/ui/button';
import { TextField, type TextFieldRef } from '@/components/ui/text-field';
import { validatePassphrase } from '@/lib/crypto';
import { useVault } from '@/lib/vault/vault-provider';
import { colors, spacing, typography } from '@/theme';

/** Owner mengganti passphrase tim (tampil sebagai sheet) */
export default function ChangePassphraseScreen() {
  const { changePassphrase } = useVault();
  const [passphrase, setPassphrase] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ passphrase?: string; confirm?: string }>({});
  const [saving, setSaving] = useState(false);
  const confirmRef = useRef<TextFieldRef>(null);

  function handleSave() {
    const next: typeof errors = {};
    const check = validatePassphrase(passphrase);
    if (!check.ok) next.passphrase = check.message;
    if (confirm !== passphrase) next.confirm = 'Konfirmasi passphrase tidak sama';
    setErrors(next);
    if (Object.keys(next).length) return;

    Alert.alert(
      'Ganti passphrase?',
      'Semua anggota harus memakai passphrase baru saat membuka vault di HP baru. HP yang sudah memakai biometrik tetap bisa membuka seperti biasa.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ganti',
          onPress: async () => {
            setSaving(true);
            try {
              await changePassphrase(passphrase);
              router.back();
              Alert.alert('Passphrase diganti', 'Bagikan passphrase baru ke anggota tim secara langsung.');
            } catch (e) {
              setSaving(false);
              Alert.alert('Gagal mengganti', e instanceof Error ? e.message : 'Coba lagi');
            }
          },
        },
      ],
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={{ gap: spacing.xs }}>
        <Text style={[typography.heading, { color: colors.textPrimary }]}>Ganti passphrase</Text>
        <Text style={[typography.body, { color: colors.textSecondary }]}>
          Data tidak dienkripsi ulang, jadi prosesnya hanya beberapa detik.
        </Text>
      </View>

      <View style={{ gap: spacing.sm }}>
        <TextField
          label="Passphrase baru"
          placeholder="Minimal 12 karakter"
          icon={<KeyRound size={18} color={colors.textSecondary} />}
          value={passphrase}
          onChangeText={setPassphrase}
          error={errors.passphrase}
          secret
          autoFocus
          autoComplete="off"
          returnKeyType="next"
          onSubmitEditing={() => confirmRef.current?.focus()}
        />
        <PassphraseStrength passphrase={passphrase} />
      </View>
      <TextField
        ref={confirmRef}
        label="Ulangi passphrase baru"
        icon={<KeyRound size={18} color={colors.textSecondary} />}
        value={confirm}
        onChangeText={setConfirm}
        error={errors.confirm}
        secret
        autoComplete="off"
        returnKeyType="go"
        onSubmitEditing={handleSave}
      />
      <Button title={saving ? 'Menyimpan…' : 'Ganti passphrase'} loading={saving} onPress={handleSave} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingTop: spacing.xl, gap: spacing.lg, backgroundColor: colors.bg, flexGrow: 1 },
});
