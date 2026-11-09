import { router } from 'expo-router';
import { ChevronRight, Plus, Tag } from 'lucide-react-native';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeInDown, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/screen-header';
import { Button } from '@/components/ui/button';
import { useCategories } from '@/features/categories/categories-provider';
import { CategoryIcon } from '@/features/categories/icons';
import { colors, radius, shadow, spacing, typography } from '@/theme';

export default function CategoriesScreen() {
  const { categories, loading, error, refresh } = useCategories();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <ScreenHeader
          title="Kategori"
          right={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tambah kategori"
              hitSlop={8}
              onPress={() => router.push('/categories/form')}
              style={({ pressed }) => [styles.add, pressed && { opacity: 0.7 }]}
            >
              <Plus size={22} color={colors.textOnDark} />
            </Pressable>
          }
        />

        {error && <Text style={[typography.caption, { color: colors.danger }]}>{error}</Text>}

        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={colors.ink} />}
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator color={colors.ink} style={{ marginTop: spacing.xxl }} />
            ) : (
              <View style={styles.empty}>
                <Tag size={28} color={colors.textMuted} />
                <Text style={[typography.subheading, { color: colors.textPrimary }]}>Belum ada kategori</Text>
                <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center' }]}>
                  Contoh: Hosting, Database, Sosial Media, Email Klien.
                </Text>
                <Button title="Tambah kategori" onPress={() => router.push('/categories/form')} />
              </View>
            )
          }
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInDown.duration(300).delay(Math.min(index, 8) * 30).easing(Easing.out(Easing.cubic))}
              layout={LinearTransition.duration(200)}
            >
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/categories/form', params: { id: item.id } })}
                style={({ pressed }) => [styles.row, shadow.soft, pressed && { opacity: 0.7 }]}
              >
                <CategoryIcon icon={item.icon} color={item.color} />
                <Text style={[typography.title, styles.name]} numberOfLines={1}>
                  {item.name}
                </Text>
                <ChevronRight size={20} color={colors.textMuted} />
              </Pressable>
            </Animated.View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: spacing.lg, gap: spacing.lg, width: '100%', maxWidth: 720, alignSelf: 'center' },
  add: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { gap: spacing.sm, paddingBottom: spacing.xxl, flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  name: { flex: 1, color: colors.textPrimary },
  empty: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.xxl, paddingHorizontal: spacing.xl },
});
