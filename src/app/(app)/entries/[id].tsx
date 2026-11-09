import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { FileText, Image as ImageIcon, Pencil, Trash2 } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/screen-header';
import { Button } from '@/components/ui/button';
import { useCategories } from '@/features/categories/categories-provider';
import { CategoryIcon } from '@/features/categories/icons';
import { deleteEntry, getEntry, type EntryDetail } from '@/features/entries/entries-api';
import { FieldRow } from '@/features/entries/field-row';
import { useVault } from '@/lib/vault/vault-provider';
import { colors, radius, shadow, spacing, typography } from '@/theme';

const enter = (delay: number) => FadeInDown.duration(350).delay(delay).easing(Easing.out(Easing.cubic));

function HeaderIcon({ label, onPress, children }: { label: string; onPress: () => void; children: React.ReactNode }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.headerIcon, shadow.soft, pressed && { opacity: 0.6 }]}
    >
      {children}
    </Pressable>
  );
}

function ComingSoon({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <View style={styles.section}>
      <Text style={[typography.subheading, { color: colors.textPrimary }]}>{title}</Text>
      <View style={styles.placeholder}>
        {icon}
        <Text style={[typography.caption, { color: colors.textSecondary }]}>Menyusul di tahap berikutnya</Text>
      </View>
    </View>
  );
}

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { dataKey } = useVault();
  const { categories } = useCategories();
  const { width } = useWindowDimensions();
  const wide = width >= 900;

  const [entry, setEntry] = useState<EntryDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Muat ulang setiap layar tampil (mis. setelah kembali dari form edit)
  useFocusEffect(
    useCallback(() => {
      if (!id || !dataKey) return;
      getEntry(id, dataKey)
        .then((e) => {
          setEntry(e);
          setError(null);
        })
        .catch((e: Error) => setError(e.message));
    }, [id, dataKey]),
  );

  const category = categories.find((c) => c.id === entry?.category_id);

  function handleDelete() {
    if (!entry) return;
    Alert.alert(`Hapus "${entry.title}"?`, 'Semua field di entry ini ikut terhapus dan tidak bisa dikembalikan.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteEntry(entry.id);
            router.back();
          } catch (e) {
            Alert.alert('Gagal menghapus', e instanceof Error ? e.message : 'Coba lagi');
          }
        },
      },
    ]);
  }

  if (!entry) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        {error ? (
          <View style={{ gap: spacing.md, alignItems: 'center', padding: spacing.xl }}>
            <Text style={[typography.body, { color: colors.danger, textAlign: 'center' }]}>{error}</Text>
            <Button title="Kembali" variant="secondary" onPress={() => router.back()} />
          </View>
        ) : (
          <ActivityIndicator color={colors.ink} />
        )}
      </SafeAreaView>
    );
  }

  const updated = new Date(entry.updated_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const fieldsSection = (
    <Animated.View entering={enter(60)} style={[styles.section, wide && styles.flex]}>
      <Text style={[typography.subheading, { color: colors.textPrimary }]}>
        Field <Text style={{ color: colors.textMuted }}>{entry.fields.length}</Text>
      </Text>
      <View style={[styles.card, shadow.soft]}>
        {entry.fields.length === 0 ? (
          <Text style={[typography.caption, { color: colors.textSecondary, paddingVertical: spacing.md }]}>
            Belum ada field. Tap ikon pensil untuk menambah.
          </Text>
        ) : (
          entry.fields.map((f, i) => (
            <View key={f.id} style={i > 0 && styles.divider}>
              <FieldRow field={f} />
            </View>
          ))
        )}
      </View>
    </Animated.View>
  );

  const sideSection = (
    <Animated.View entering={enter(120)} style={[{ gap: spacing.lg }, wide && styles.flex]}>
      {(!!entry.notes || entry.notesError) && (
        <View style={styles.section}>
          <Text style={[typography.subheading, { color: colors.textPrimary }]}>Catatan</Text>
          <View style={[styles.card, shadow.soft, { paddingVertical: spacing.md }]}>
            <Text
              selectable
              style={[typography.body, { color: entry.notesError ? colors.danger : colors.textPrimary }]}
            >
              {entry.notesError ? 'Catatan gagal dibuka' : entry.notes}
            </Text>
          </View>
        </View>
      )}
      <ComingSoon title="Gambar" icon={<ImageIcon size={22} color={colors.textMuted} />} />
      <ComingSoon title="Dokumen" icon={<FileText size={22} color={colors.textMuted} />} />
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={[styles.container, wide && { maxWidth: 1100 }]}>
        <ScreenHeader
          title=""
          right={
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <HeaderIcon
                label="Edit"
                onPress={() => router.push({ pathname: '/entries/form', params: { id: entry.id } })}
              >
                <Pencil size={18} color={colors.textPrimary} />
              </HeaderIcon>
              <HeaderIcon label="Hapus" onPress={handleDelete}>
                <Trash2 size={18} color={colors.danger} />
              </HeaderIcon>
            </View>
          }
        />

        <Animated.View entering={enter(0)} style={styles.hero}>
          <CategoryIcon icon={category?.icon ?? 'folder'} color={category?.color ?? colors.textSecondary} size={56} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[typography.heading, { color: colors.textPrimary }]}>{entry.title}</Text>
            {!!entry.client_name && (
              <Text style={[typography.body, { color: colors.textSecondary }]}>{entry.client_name}</Text>
            )}
            <Text style={[typography.caption, { color: colors.textMuted }]}>
              {category ? `${category.name} · ` : ''}Diubah {updated}
            </Text>
          </View>
        </Animated.View>

        <View style={[{ gap: spacing.lg }, wide && styles.columns]}>
          {fieldsSection}
          {sideSection}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  container: { padding: spacing.lg, gap: spacing.xl, width: '100%', maxWidth: 720, alignSelf: 'center' },
  flex: { flex: 1 },
  columns: { flexDirection: 'row', alignItems: 'flex-start' },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  section: { gap: spacing.sm },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: spacing.lg },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  placeholder: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
});
