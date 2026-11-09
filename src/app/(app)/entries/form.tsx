import { router, useLocalSearchParams } from 'expo-router';
import { Plus, Settings2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/screen-header';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useCategories } from '@/features/categories/categories-provider';
import { CategoryIcon } from '@/features/categories/icons';
import { getEntry, newFieldId, saveEntry, type EntryDraft, type FieldDraft } from '@/features/entries/entries-api';
import { FieldEditor } from '@/features/entries/field-editor';
import { useVault } from '@/lib/vault/vault-provider';
import { colors, radius, spacing, typography } from '@/theme';

const emptyDraft = (categoryId: string | null): EntryDraft => ({
  title: '',
  client_name: '',
  category_id: categoryId,
  notes: '',
  // Entry baru langsung punya 2 field yang paling sering dipakai
  fields: [
    { id: newFieldId(), label: 'Email', type: 'email', is_secret: false, value: '' },
    { id: newFieldId(), label: 'Password', type: 'password', is_secret: true, value: '' },
  ],
});

type Errors = { title?: string; fields?: Record<string, string>; form?: string };

export default function EntryFormScreen() {
  const { id, categoryId } = useLocalSearchParams<{ id?: string; categoryId?: string }>();
  const { workspace, dataKey } = useVault();
  const { categories } = useCategories();

  const [draft, setDraft] = useState<EntryDraft | null>(id ? null : emptyDraft(categoryId ?? null));
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  // Mode edit: muat & dekripsi entry
  useEffect(() => {
    if (!id || !dataKey) return;
    getEntry(id, dataKey)
      .then((e) =>
        setDraft({
          title: e.title,
          client_name: e.client_name ?? '',
          category_id: e.category_id,
          notes: e.notes,
          fields: e.fields.map(({ error: _error, ...f }) => f),
        }),
      )
      .catch((e: Error) => setErrors({ form: e.message }));
  }, [id, dataKey]);

  if (!draft) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        {errors.form ? (
          <Text style={[typography.body, { color: colors.danger }]}>{errors.form}</Text>
        ) : (
          <ActivityIndicator color={colors.ink} />
        )}
      </SafeAreaView>
    );
  }

  const set = (patch: Partial<EntryDraft>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  const setFields = (fn: (fields: FieldDraft[]) => FieldDraft[]) =>
    setDraft((d) => (d ? { ...d, fields: fn(d.fields) } : d));

  function addField() {
    setFields((fields) => [...fields, { id: newFieldId(), label: '', type: 'text', is_secret: false, value: '' }]);
  }

  function moveField(index: number, direction: -1 | 1) {
    setFields((fields) => {
      const next = [...fields];
      const target = index + direction;
      if (target < 0 || target >= next.length) return fields;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function removeField(fieldId: string) {
    setFields((fields) => fields.filter((f) => f.id !== fieldId));
  }

  async function handleSave() {
    if (!draft || !workspace || !dataKey) return;
    // Field yang label & nilainya kosong dibuang diam-diam
    const fields = draft.fields.filter((f) => f.label.trim() || f.value.trim());
    const next: Errors = {};
    if (!draft.title.trim()) next.title = 'Judul wajib diisi';
    const fieldErrors: Record<string, string> = {};
    for (const f of fields) if (!f.label.trim()) fieldErrors[f.id] = 'Label wajib diisi';
    if (Object.keys(fieldErrors).length) next.fields = fieldErrors;
    setErrors(next);
    if (next.title || next.fields) return;

    setSaving(true);
    try {
      const savedId = await saveEntry(workspace.id, dataKey, { ...draft, fields }, id);
      if (id) router.back();
      else router.replace({ pathname: '/entries/[id]', params: { id: savedId } });
    } catch (e) {
      setSaving(false);
      Alert.alert('Gagal menyimpan', e instanceof Error ? e.message : 'Coba lagi');
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <ScreenHeader title={id ? 'Edit entry' : 'Entry baru'} />

          <View style={styles.group}>
            <TextField
              label="Judul"
              placeholder="Contoh: Hosting Toko Budi"
              value={draft.title}
              onChangeText={(title) => {
                set({ title });
                if (errors.title) setErrors((e) => ({ ...e, title: undefined }));
              }}
              error={errors.title}
              autoFocus={!id}
              autoCapitalize="words"
            />
            <TextField
              label="Nama klien"
              placeholder="Opsional"
              value={draft.client_name}
              onChangeText={(client_name) => set({ client_name })}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.group}>
            <View style={styles.sectionHeader}>
              <Text style={[typography.label, { color: colors.textSecondary, flex: 1 }]}>Kategori</Text>
              <Pressable hitSlop={8} onPress={() => router.push('/categories')} style={styles.manage}>
                <Settings2 size={14} color={colors.textSecondary} />
                <Text style={[typography.label, { color: colors.textSecondary }]}>Kelola</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {[{ id: null, name: 'Tanpa kategori', icon: 'folder', color: colors.textSecondary }, ...categories].map(
                (c) => {
                  const active = draft.category_id === c.id;
                  return (
                    <Pressable
                      key={c.id ?? 'none'}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                      onPress={() => set({ category_id: c.id })}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <CategoryIcon icon={c.icon} color={active ? colors.textOnDark : c.color} size={24} />
                      <Text style={[typography.label, { color: active ? colors.textOnDark : colors.textPrimary }]}>
                        {c.name}
                      </Text>
                    </Pressable>
                  );
                },
              )}
            </ScrollView>
          </View>

          <View style={styles.group}>
            <Text style={[typography.subheading, { color: colors.textPrimary }]}>
              Field <Text style={{ color: colors.textMuted }}>{draft.fields.length}</Text>
            </Text>
            {draft.fields.map((field, index) => (
              <Animated.View
                key={field.id}
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(150)}
                layout={LinearTransition.duration(220)}
              >
                <FieldEditor
                  field={field}
                  error={errors.fields?.[field.id]}
                  isFirst={index === 0}
                  isLast={index === draft.fields.length - 1}
                  onChange={(patch) => setFields((fields) => fields.map((f) => (f.id === field.id ? { ...f, ...patch } : f)))}
                  onMove={(direction) => moveField(index, direction)}
                  onRemove={() => removeField(field.id)}
                />
              </Animated.View>
            ))}
            <Animated.View layout={LinearTransition.duration(220)}>
              <Button
                title="Tambah field"
                variant="secondary"
                onPress={addField}
                icon={<Plus size={18} color={colors.textPrimary} />}
              />
            </Animated.View>
          </View>

          <Animated.View layout={LinearTransition.duration(220)} style={styles.group}>
            <TextField
              label="Catatan (terenkripsi)"
              placeholder="Info tambahan, mis. tanggal perpanjang hosting"
              value={draft.notes}
              onChangeText={(notes) => set({ notes })}
              multiline
            />
            <Button title={id ? 'Simpan perubahan' : 'Simpan entry'} loading={saving} onPress={handleSave} />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
    gap: spacing.xl,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  group: { gap: spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center' },
  manage: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chips: { gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingLeft: 4,
    paddingRight: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.sm + 2,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
});
