import { router, useLocalSearchParams } from 'expo-router';
import { Check, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useCategories } from '@/features/categories/categories-provider';
import { CATEGORY_COLORS, CATEGORY_ICON_KEYS, CATEGORY_ICONS, CategoryIcon } from '@/features/categories/icons';
import { colors, radius, spacing, typography } from '@/theme';

const ICON_GAP = spacing.sm;

const chunk = <T,>(items: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, (i + 1) * size));

/** Form tambah / edit kategori (tampil sebagai sheet dari bawah) */
export default function CategoryFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { categories, create, update, remove } = useCategories();
  const existing = categories.find((c) => c.id === id);

  const [name, setName] = useState(existing?.name ?? '');
  const [color, setColor] = useState<string>(existing?.color ?? CATEGORY_COLORS[0]);
  const [icon, setIcon] = useState(existing?.icon ?? 'folder');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Ukuran kotak ikon dihitung dari lebar form supaya tiap baris rata kiri-kanan
  const [gridWidth, setGridWidth] = useState(0);
  const iconColumns = gridWidth >= 560 ? 14 : 7;
  const iconGlyph = Math.min(22, ((gridWidth - ICON_GAP * (iconColumns - 1)) / iconColumns) * 0.45);

  async function handleSave() {
    const trimmed = name.trim();
    if (trimmed.length < 2) return setError('Nama kategori minimal 2 karakter');
    const duplicate = categories.some((c) => c.id !== id && c.name.toLowerCase() === trimmed.toLowerCase());
    if (duplicate) return setError('Kategori dengan nama ini sudah ada');

    setSaving(true);
    try {
      if (existing) await update(existing.id, { name: trimmed, color, icon });
      else await create({ name: trimmed, color, icon });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan');
      setSaving(false);
    }
  }

  function handleDelete() {
    if (!existing) return;
    Alert.alert(`Hapus "${existing.name}"?`, 'Entry di kategori ini tidak ikut terhapus, hanya jadi tanpa kategori.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await remove(existing.id);
            router.back();
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Gagal menghapus');
          }
        },
      },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.titleRow}>
        <CategoryIcon icon={icon} color={color} size={48} />
        <Text style={[typography.heading, styles.title]} numberOfLines={1}>
          {existing ? 'Edit kategori' : 'Kategori baru'}
        </Text>
      </View>

      <TextField
        label="Nama kategori"
        placeholder="Contoh: Hosting, Database"
        value={name}
        onChangeText={(t) => {
          setName(t);
          setError(null);
        }}
        error={error}
        autoFocus={!existing}
        autoCapitalize="words"
        returnKeyType="done"
        onSubmitEditing={handleSave}
      />

      <View style={styles.section}>
        <Text style={[typography.label, styles.label]}>Warna</Text>
        <View style={styles.wrap}>
          {CATEGORY_COLORS.map((c) => (
            <Pressable
              key={c}
              accessibilityRole="radio"
              accessibilityState={{ selected: color === c }}
              accessibilityLabel={`Warna ${c}`}
              onPress={() => setColor(c)}
              style={[styles.swatch, { backgroundColor: c }, color === c && styles.swatchActive]}
            >
              {color === c && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[typography.label, styles.label]}>Ikon</Text>
        {/* Disusun per baris & tiap kotak flex:1, jadi selalu rata kiri-kanan dengan tombol di bawah */}
        <View style={{ gap: ICON_GAP }} onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}>
          {gridWidth > 0 &&
            chunk(CATEGORY_ICON_KEYS, iconColumns).map((row, rowIndex) => (
              <View key={rowIndex} style={[styles.iconRow, { gap: ICON_GAP }]}>
                {row.map((key) => {
                  const Icon = CATEGORY_ICONS[key];
                  const active = icon === key;
                  return (
                    <Pressable
                      key={key}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={`Ikon ${key}`}
                      onPress={() => setIcon(key)}
                      style={[styles.iconOption, active && { backgroundColor: colors.ink, borderColor: colors.ink }]}
                    >
                      <Icon size={iconGlyph} color={active ? colors.textOnDark : colors.textPrimary} />
                    </Pressable>
                  );
                })}
                {/* Baris terakhir yang tidak penuh: isi kotak kosong supaya ukuran tetap sama */}
                {Array.from({ length: iconColumns - row.length }, (_, i) => (
                  <View key={`empty-${i}`} style={styles.iconSpacer} />
                ))}
              </View>
            ))}
        </View>
      </View>

      <Button title={existing ? 'Simpan perubahan' : 'Tambah kategori'} loading={saving} onPress={handleSave} />
      {existing && (
        <Button
          title="Hapus kategori"
          variant="ghost"
          onPress={handleDelete}
          icon={<Trash2 size={18} color={colors.danger} />}
          textColor={colors.danger}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingTop: spacing.xl, gap: spacing.lg, backgroundColor: colors.bg, flexGrow: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: { flex: 1, color: colors.textPrimary },
  section: { gap: spacing.sm },
  label: { color: colors.textSecondary },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  swatch: { width: 36, height: 36, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  swatchActive: { borderWidth: 3, borderColor: colors.surface, outlineWidth: 2, outlineColor: colors.ink },
  iconRow: { flexDirection: 'row' },
  iconSpacer: { flex: 1, aspectRatio: 1 },
  iconOption: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
