// Beranda sementara: info tim + kunci vault. Daftar entry (CRUD) menyusul di tahap berikutnya.
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ChevronRight, Fingerprint, Lock, LogOut, Tag } from 'lucide-react-native';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { useCategories } from '@/features/categories/categories-provider';
import { CategoryIcon } from '@/features/categories/icons';
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
  const { categories } = useCategories();
  const name = (session?.user.user_metadata?.full_name as string | undefined) ?? session?.user.email ?? '';

  async function handleEnableBiometric() {
    try {
      await enableBiometric();
    } catch (e) {
      Alert.alert('Biometrik belum aktif', e instanceof Error ? e.message : 'Coba lagi');
    }
  }

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
              onPress={handleEnableBiometric}
              icon={<Fingerprint size={18} color={colors.textPrimary} />}
            />
          </Animated.View>
        )}

        <Animated.View entering={enter(150)}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/categories')}
            style={({ pressed }) => [styles.card, shadow.soft, pressed && { opacity: 0.8 }]}
          >
            <View style={styles.cardHeader}>
              <Tag size={18} color={colors.textPrimary} />
              <Text style={[typography.subheading, { color: colors.textPrimary, flex: 1 }]}>Kategori</Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>{categories.length}</Text>
              <ChevronRight size={20} color={colors.textMuted} />
            </View>
            {categories.length > 0 ? (
              <View style={styles.chips}>
                {categories.slice(0, 6).map((c) => (
                  <View key={c.id} style={styles.chip}>
                    <CategoryIcon icon={c.icon} color={c.color} size={24} />
                    <Text style={[typography.label, { color: colors.textPrimary }]} numberOfLines={1}>
                      {c.name}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                Kelompokkan akun klien, mis. Hosting, Database, Sosial Media.
              </Text>
            )}
          </Pressable>
        </Animated.View>

        <Animated.View entering={enter(210)} style={[styles.card, styles.empty]}>
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
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingRight: spacing.sm + 2,
    paddingLeft: 4,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    maxWidth: '100%',
  },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', backgroundColor: 'transparent' },
});
