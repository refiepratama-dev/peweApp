import { KeyRound, RefreshCw, Users } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AuthShell } from '@/components/auth-shell';
import { PassphraseStrength } from '@/components/passphrase-strength';
import { Button } from '@/components/ui/button';
import { TextField, type TextFieldRef } from '@/components/ui/text-field';
import { useAuth } from '@/lib/auth/auth-provider';
import { validatePassphrase } from '@/lib/crypto';
import { useVault } from '@/lib/vault/vault-provider';
import { colors, radius, shadow, spacing, typography } from '@/theme';

type Errors = { name?: string; passphrase?: string; confirm?: string; form?: string };

/** Muncul setelah login kalau user belum punya / belum diundang ke workspace mana pun */
export function SetupWorkspaceScreen() {
  const { session, signOut } = useAuth();
  const { createWorkspace, refresh } = useVault();
  const [name, setName] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const passRef = useRef<TextFieldRef>(null);
  const confirmRef = useRef<TextFieldRef>(null);

  function validate(): boolean {
    const next: Errors = {};
    if (name.trim().length < 2) next.name = 'Nama tim minimal 2 karakter';
    const check = validatePassphrase(passphrase);
    if (!check.ok) next.passphrase = check.message;
    if (confirm !== passphrase) next.confirm = 'Konfirmasi passphrase tidak sama';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleCreate() {
    if (!validate()) return;
    Alert.alert(
      'Simpan passphrase ini baik-baik',
      'Passphrase tidak bisa dipulihkan. Kalau lupa, semua data di vault tidak bisa dibuka, termasuk oleh owner. Bagikan langsung ke anggota tim, jangan lewat chat grup.',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Sudah saya simpan', onPress: submit },
      ],
    );
  }

  async function submit() {
    setLoading(true);
    try {
      await createWorkspace(name.trim(), passphrase);
    } catch (e) {
      setErrors({ form: e instanceof Error ? e.message : 'Gagal membuat tim' });
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Buat tim"
      subtitle="Satu tim = satu vault bersama dengan satu passphrase."
      heroText="Passphrase tim mengunci semua data. Server tidak pernah tahu isinya."
      footer={
        <View style={[styles.joinCard, shadow.soft]}>
          <View style={styles.joinHeader}>
            <Users size={18} color={colors.textPrimary} />
            <Text style={[typography.title, { color: colors.textPrimary }]}>Mau gabung tim yang sudah ada?</Text>
          </View>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            Minta owner tim menambahkan email{' '}
            <Text style={[typography.label, { color: colors.textPrimary }]}>{session?.user.email}</Text>, lalu tap
            Cek lagi.
          </Text>
          <View style={styles.joinActions}>
            <Button
              title="Cek lagi"
              variant="secondary"
              onPress={refresh}
              icon={<RefreshCw size={16} color={colors.textPrimary} />}
              style={styles.flex}
            />
            <Button title="Keluar" variant="ghost" onPress={signOut} style={styles.flex} />
          </View>
        </View>
      }
    >
      <View style={{ gap: 14 }}>
        <TextField
          label="Nama tim"
          placeholder="Contoh: Tim Refie Dev"
          icon={<Users size={18} color={colors.textSecondary} />}
          value={name}
          onChangeText={setName}
          error={errors.name}
          autoCapitalize="words"
          returnKeyType="next"
          onSubmitEditing={() => passRef.current?.focus()}
        />
        <View style={{ gap: spacing.sm }}>
          <TextField
            ref={passRef}
            label="Passphrase tim"
            placeholder="Contoh: kopi pagi di palembang"
            icon={<KeyRound size={18} color={colors.textSecondary} />}
            value={passphrase}
            onChangeText={setPassphrase}
            error={errors.passphrase}
            secret
            autoComplete="off"
            returnKeyType="next"
            onSubmitEditing={() => confirmRef.current?.focus()}
          />
          <PassphraseStrength passphrase={passphrase} />
        </View>
        <TextField
          ref={confirmRef}
          label="Ulangi passphrase"
          placeholder="Ketik ulang passphrase"
          icon={<KeyRound size={18} color={colors.textSecondary} />}
          value={confirm}
          onChangeText={setConfirm}
          error={errors.confirm}
          secret
          autoComplete="off"
          returnKeyType="go"
          onSubmitEditing={handleCreate}
        />
      </View>

      {errors.form && <Text style={[typography.caption, { color: colors.danger }]}>{errors.form}</Text>}

      <Button title={loading ? 'Membuat vault…' : 'Buat tim & vault'} loading={loading} onPress={handleCreate} />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  joinCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  joinHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  joinActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
});
