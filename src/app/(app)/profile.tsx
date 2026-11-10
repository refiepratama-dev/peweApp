import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { Fingerprint, Lock, LogOut, Save, User } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components/avatar';
import { ScreenHeader } from '@/components/screen-header';
import { Button } from '@/components/ui/button';
import { TextField, type TextFieldRef } from '@/components/ui/text-field';
import { useAuth } from '@/lib/auth/auth-provider';
import { authErrorMessage } from '@/lib/auth/errors';
import { supabase } from '@/lib/supabase';
import { useVault } from '@/lib/vault/vault-provider';
import { colors, radius, shadow, spacing, typography } from '@/theme';

function appVersionLabel() {
  const version = Constants.expoConfig?.version ?? '';
  if (!Updates.isEnabled || Updates.isEmbeddedLaunch || !Updates.createdAt) return `Pewe v${version}`;
  const date = Updates.createdAt.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  return `Pewe v${version} · update ${date}`;
}

const enter = (delay: number) => FadeInDown.duration(350).delay(delay).easing(Easing.out(Easing.cubic));

function Section({ title, children, delay }: { title: string; children: React.ReactNode; delay: number }) {
  return (
    <Animated.View entering={enter(delay)} style={{ gap: spacing.sm }}>
      <Text style={[typography.subheading, { color: colors.textPrimary }]}>{title}</Text>
      <View style={[styles.card, shadow.soft]}>{children}</View>
    </Animated.View>
  );
}

export default function ProfileScreen() {
  const { session } = useAuth();
  const {
    workspace,
    isOwner,
    biometricAvailable,
    biometricEnabled,
    enableBiometric,
    disableBiometric,
    signOutAndForget,
  } = useVault();
  const user = session?.user;
  const currentName = (user?.user_metadata?.full_name as string | undefined) ?? '';

  const [name, setName] = useState(currentName);
  const [nameError, setNameError] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwErrors, setPwErrors] = useState<{ password?: string; confirm?: string }>({});
  const [savingPw, setSavingPw] = useState(false);
  const confirmRef = useRef<TextFieldRef>(null);

  const [bioBusy, setBioBusy] = useState(false);

  async function saveName() {
    const trimmed = name.trim();
    if (trimmed.length < 2) return setNameError('Nama minimal 2 karakter');
    setSavingName(true);
    // Sesi ikut diperbarui otomatis, jadi nama di beranda & daftar tim langsung berubah
    const { error } = await supabase.auth.updateUser({ data: { full_name: trimmed } });
    setSavingName(false);
    if (error) return setNameError(authErrorMessage(error));
    setNameError(null);
    Alert.alert('Tersimpan', 'Nama kamu sudah diperbarui.');
  }

  async function savePassword() {
    const next: typeof pwErrors = {};
    if (password.length < 8) next.password = 'Password minimal 8 karakter';
    if (confirm !== password) next.confirm = 'Konfirmasi password tidak sama';
    setPwErrors(next);
    if (Object.keys(next).length) return;

    setSavingPw(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSavingPw(false);
    if (error) return setPwErrors({ password: authErrorMessage(error) });
    setPassword('');
    setConfirm('');
    Alert.alert('Password diganti', 'Gunakan password baru saat masuk berikutnya.');
  }

  async function toggleBiometric(value: boolean) {
    setBioBusy(true);
    try {
      if (value) await enableBiometric();
      else await disableBiometric();
    } catch (e) {
      Alert.alert('Biometrik belum aktif', e instanceof Error ? e.message : 'Coba lagi');
    } finally {
      setBioBusy(false);
    }
  }

  function handleSignOut() {
    Alert.alert(
      'Keluar dari akun?',
      'Kunci biometrik di HP ini ikut dihapus. Untuk masuk lagi perlu password akun & passphrase tim.',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Keluar', style: 'destructive', onPress: signOutAndForget },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <ScreenHeader title="Profil" />

          <Animated.View entering={enter(0)} style={styles.identity}>
            <Avatar name={currentName || user?.email || ''} size={64} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[typography.heading, { color: colors.textPrimary }]} numberOfLines={1}>
                {currentName || 'Tanpa nama'}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]} numberOfLines={1}>
                {user?.email}
              </Text>
              <Text style={[typography.caption, { color: colors.textMuted }]} numberOfLines={1}>
                {workspace?.name} · {isOwner ? 'Owner' : 'Anggota'}
              </Text>
            </View>
          </Animated.View>

          <Section title="Nama" delay={60}>
            <TextField
              placeholder="Nama kamu"
              icon={<User size={18} color={colors.textSecondary} />}
              value={name}
              onChangeText={(t) => {
                setName(t);
                setNameError(null);
              }}
              error={nameError}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={saveName}
            />
            <Button
              title="Simpan nama"
              variant="secondary"
              loading={savingName}
              disabled={name.trim() === currentName}
              onPress={saveName}
              icon={<Save size={18} color={colors.textPrimary} />}
            />
          </Section>

          <Section title="Password akun" delay={120}>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              Ini password untuk masuk akun, bukan passphrase tim.
            </Text>
            <TextField
              label="Password baru"
              placeholder="Minimal 8 karakter"
              icon={<Lock size={18} color={colors.textSecondary} />}
              value={password}
              onChangeText={setPassword}
              error={pwErrors.password}
              secret
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
              onSubmitEditing={() => confirmRef.current?.focus()}
            />
            <TextField
              ref={confirmRef}
              label="Ulangi password baru"
              icon={<Lock size={18} color={colors.textSecondary} />}
              value={confirm}
              onChangeText={setConfirm}
              error={pwErrors.confirm}
              secret
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="done"
              onSubmitEditing={savePassword}
            />
            <Button title="Ganti password" variant="secondary" loading={savingPw} onPress={savePassword} />
          </Section>

          {biometricAvailable && (
            <Section title="Keamanan" delay={180}>
              <View style={styles.switchRow}>
                <Fingerprint size={20} color={colors.textPrimary} />
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyMedium, { color: colors.textPrimary }]}>Buka vault pakai biometrik</Text>
                  <Text style={[typography.caption, { color: colors.textSecondary }]}>Hanya berlaku di HP ini</Text>
                </View>
                <Switch
                  value={biometricEnabled}
                  disabled={bioBusy}
                  onValueChange={toggleBiometric}
                  trackColor={{ true: colors.ink, false: colors.border }}
                  thumbColor={colors.surface}
                  ios_backgroundColor={colors.border}
                />
              </View>
            </Section>
          )}

          <Animated.View entering={enter(240)}>
            <Button
              title="Keluar dari akun"
              variant="ghost"
              textColor={colors.danger}
              onPress={handleSignOut}
              icon={<LogOut size={18} color={colors.danger} />}
            />
            <Text style={[typography.caption, styles.version]}>{appVersionLabel()}</Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
    gap: spacing.xl,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  version: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
