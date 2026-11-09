// Beranda sementara: info tim + kunci vault. Daftar entry (CRUD) menyusul di tahap berikutnya.
import { LinearGradient } from 'expo-linear-gradient';
import { Fingerprint, Lock, LogOut } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/auth-provider';
import { useVault } from '@/lib/vault/vault-provider';
import { colors, gradients, radius, shadow, spacing, typography } from '@/theme';

const enter = (delay: number) => FadeInDown.duration(400).delay(delay).easing(Easing.out(Easing.cubic));

function IconButton({ label, onPress, children }: { label: string; onPress: () => void; children: React.ReactNode }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, shadow.soft, pressed && { opacity: 0.6 }]}
    >
      {children}
    </Pressable>
  );
}

export default function Home() {
  const { session } = useAuth();
  const { workspace, isOwner, lock, signOutAndForget, biometricAvailable, biometricEnabled, enableBiometric } =
    useVault();
  const name = (session?.user.user_metadata?.full_name as string | undefined) ?? session?.user.email ?? '';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Animated.View entering={enter(0)} style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[typography.body, { color: colors.textSecondary }]}>Hello</Text>
            <Text style={[typography.display, { color: colors.textPrimary }]} numberOfLines={1}>
              {name}
            </Text>
          </View>
          <IconButton label="Kunci vault" onPress={lock}>
            <Lock size={20} color={colors.textPrimary} />
          </IconButton>
          <IconButton label="Keluar" onPress={signOutAndForget}>
            <LogOut size={20} color={colors.textPrimary} />
          </IconButton>
        </Animated.View>

        <Animated.View entering={enter(60)}>
          <LinearGradient
            colors={gradients.card.colors}
            start={gradients.card.start}
            end={gradients.card.end}
            style={[styles.teamCard, shadow.strong]}
          >
            <Text style={[typography.label, { color: colors.textOnDarkMuted }]}>TIM</Text>
            <Text style={[typography.heading, { color: colors.textOnDark }]} numberOfLines={1}>
              {workspace?.name}
            </Text>
            <View style={styles.badge}>
              <Text style={[typography.label, { color: colors.textOnDark }]}>{isOwner ? 'Owner' : 'Anggota'}</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {biometricAvailable && !biometricEnabled && (
          <Animated.View entering={enter(120)} style={[styles.card, shadow.soft]}>
            <Text style={[typography.title, { color: colors.textPrimary }]}>Buka vault lebih cepat</Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              Aktifkan sidik jari / Face ID supaya tidak perlu mengetik passphrase setiap membuka app.
            </Text>
            <Button
              title="Aktifkan biometrik"
              variant="secondary"
              onPress={enableBiometric}
              icon={<Fingerprint size={18} color={colors.textPrimary} />}
            />
          </Animated.View>
        )}

        <Animated.View entering={enter(180)} style={[styles.card, styles.empty]}>
          <Text style={[typography.subheading, { color: colors.textPrimary }]}>Vault masih kosong</Text>
          <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center' }]}>
            Daftar klien & akun akan muncul di sini.
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg, gap: spacing.lg, width: '100%', maxWidth: 720, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamCard: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.xs, minHeight: 140, justifyContent: 'flex-end' },
  badge: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', backgroundColor: 'transparent' },
});
