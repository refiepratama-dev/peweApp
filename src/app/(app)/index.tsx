// Beranda: info tim, kategori, pencarian & daftar entry
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { ChevronRight, Fingerprint, Lock, LogOut, Plus, Search, Tag } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useCategories } from '@/features/categories/categories-provider';
import { CategoryIcon } from '@/features/categories/icons';
import { listEntries, type EntrySummary } from '@/features/entries/entries-api';
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
  const { width } = useWindowDimensions();
  const columns = width >= 900 ? 2 : 1;
  const name = (session?.user.user_metadata?.full_name as string | undefined) ?? session?.user.email ?? '';

  const [entries, setEntries] = useState<EntrySummary[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!workspace) return;
    try {
      setEntries(await listEntries(workspace.id));
    } catch (e) {
      Alert.alert('Gagal memuat entry', e instanceof Error ? e.message : 'Coba lagi');
    } finally {
      setLoaded(true);
    }
  }, [workspace]);

  // Muat ulang setiap kembali ke beranda (setelah tambah / edit / hapus)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter(
      (e) =>
        (!filter || e.category_id === filter) &&
        (!q || e.title.toLowerCase().includes(q) || (e.client_name ?? '').toLowerCase().includes(q)),
    );
  }, [entries, query, filter]);

  async function handleEnableBiometric() {
    try {
      await enableBiometric();
    } catch (e) {
      Alert.alert('Biometrik belum aktif', e instanceof Error ? e.message : 'Coba lagi');
    }
  }

  const header = (
    <View style={styles.headerBlock}>
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
        <Pressable accessibilityRole="button" accessibilityLabel="Kelola tim" onPress={() => router.push('/team')}>
          <LinearGradient
            colors={gradients.card.colors}
            start={gradients.card.start}
            end={gradients.card.end}
            style={[styles.teamCard, shadow.strong]}
          >
            <View style={styles.teamTop}>
              <Text style={[typography.label, { color: colors.textOnDarkMuted }]}>TIM</Text>
              <View style={styles.badge}>
                <Text style={[typography.label, { color: colors.textOnDark }]}>{isOwner ? 'Owner' : 'Anggota'}</Text>
              </View>
            </View>
            <Text style={[typography.heading, { color: colors.textOnDark }]} numberOfLines={1}>
              {workspace?.name}
            </Text>
            <View style={styles.teamBottom}>
              <Text style={[typography.caption, { color: colors.textOnDarkMuted, flex: 1 }]}>
                {entries.length} entry · {categories.length} kategori
              </Text>
              <Text style={[typography.label, { color: colors.textOnDark }]}>Kelola tim</Text>
              <ChevronRight size={16} color={colors.textOnDark} />
            </View>
          </LinearGradient>
        </Pressable>
      </Animated.View>

      {biometricAvailable && !biometricEnabled && (
        <Animated.View entering={enter(100)} style={[styles.card, shadow.soft]}>
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

      <Animated.View entering={enter(140)} style={{ gap: spacing.md }}>
        <TextField
          placeholder="Cari judul atau nama klien"
          value={query}
          onChangeText={setQuery}
          icon={<Search size={18} color={colors.textSecondary} />}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {[{ id: null, name: 'Semua' }, ...categories].map((c) => {
            const active = filter === c.id;
            return (
              <Pressable
                key={c.id ?? 'all'}
                onPress={() => setFilter(c.id)}
                style={[styles.filter, active && styles.filterActive]}
              >
                <Text style={[typography.label, { color: active ? colors.textOnDark : colors.textPrimary }]}>
                  {c.name}
                </Text>
              </Pressable>
            );
          })}
          <Pressable onPress={() => router.push('/categories')} style={[styles.filter, styles.filterManage]}>
            <Tag size={12} color={colors.textSecondary} />
            <Text style={[typography.label, { color: colors.textSecondary }]}>Kelola</Text>
          </Pressable>
        </ScrollView>
      </Animated.View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <FlatList
        key={columns}
        data={visible}
        numColumns={columns}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={columns > 1 ? { gap: spacing.sm } : undefined}
        contentContainerStyle={styles.container}
        ListHeaderComponent={header}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.ink}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
        ListEmptyComponent={
          loaded ? (
            <View style={styles.empty}>
              <Text style={[typography.subheading, { color: colors.textPrimary }]}>
                {entries.length ? 'Tidak ada yang cocok' : 'Vault masih kosong'}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center' }]}>
                {entries.length
                  ? 'Coba kata kunci atau kategori lain.'
                  : 'Tap tombol + untuk menyimpan akun klien pertama.'}
              </Text>
            </View>
          ) : undefined
        }
        renderItem={({ item, index }) => {
          const category = item.category_id ? categoryMap.get(item.category_id) : undefined;
          return (
            <Animated.View
              entering={FadeInDown.duration(300)
                .delay(Math.min(index, 8) * 30)
                .easing(Easing.out(Easing.cubic))}
              style={styles.flex}
            >
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: '/entries/[id]',
                    params: { id: item.id },
                  })
                }
                style={({ pressed }) => [styles.entry, shadow.soft, pressed && { opacity: 0.75 }]}
              >
                <CategoryIcon icon={category?.icon ?? 'folder'} color={category?.color ?? colors.textSecondary} />
                <View style={styles.flex}>
                  <Text style={[typography.title, { color: colors.textPrimary }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textSecondary }]} numberOfLines={1}>
                    {[item.client_name, `${item.field_count} field`].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.textMuted} />
              </Pressable>
            </Animated.View>
          );
        }}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Tambah entry"
        onPress={() =>
          router.push(filter ? { pathname: '/entries/form', params: { categoryId: filter } } : '/entries/form')
        }
        style={({ pressed }) => [styles.fab, shadow.strong, pressed && { transform: [{ scale: 0.95 }] }]}
      >
        <Plus size={26} color={colors.textOnDark} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  container: {
    padding: spacing.lg,
    paddingBottom: 120,
    gap: spacing.sm,
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
  },
  headerBlock: { gap: spacing.lg, marginBottom: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
    minHeight: 140,
    justifyContent: 'flex-end',
  },
  teamTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 'auto',
  },
  teamBottom: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  badge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  filters: { gap: spacing.sm },
  filter: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  filterManage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderStyle: 'dashed',
  },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xxl,
  },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xxl,
    width: 60,
    height: 60,
    borderRadius: radius.full,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
