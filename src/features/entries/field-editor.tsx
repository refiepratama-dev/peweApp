import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { TextField } from '@/components/ui/text-field';
import { colors, radius, shadow, spacing, typography } from '@/theme';
import type { FieldDraft } from './entries-api';
import { FIELD_TYPE_KEYS, FIELD_TYPES, type FieldType } from './field-types';

type FieldEditorProps = {
  field: FieldDraft;
  error?: string;
  isFirst: boolean;
  isLast: boolean;
  onChange: (patch: Partial<FieldDraft>) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
};

function SmallIcon({
  label,
  onPress,
  disabled,
  children,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [styles.small, (pressed || disabled) && { opacity: disabled ? 0.3 : 0.6 }]}
    >
      {children}
    </Pressable>
  );
}

/** Kartu edit satu field: tipe, label, nilai, rahasia, urutan & hapus */
export function FieldEditor({ field, error, isFirst, isLast, onChange, onMove, onRemove }: FieldEditorProps) {
  const meta = FIELD_TYPES[field.type];

  function changeType(type: FieldType) {
    const prevDefault = FIELD_TYPES[field.type].defaultLabel;
    const next = FIELD_TYPES[type];
    onChange({
      type,
      is_secret: next.secret,
      // Ganti label otomatis hanya kalau label masih kosong / masih label default tipe sebelumnya
      label: !field.label.trim() || field.label === prevDefault ? next.defaultLabel : field.label,
    });
  }

  return (
    <View style={[styles.card, shadow.soft]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.types}>
        {FIELD_TYPE_KEYS.map((type) => {
          const Icon = FIELD_TYPES[type].icon;
          const active = field.type === type;
          return (
            <Pressable
              key={type}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              onPress={() => changeType(type)}
              style={[styles.typeChip, active && styles.typeChipActive]}
            >
              <Icon size={14} color={active ? colors.textOnDark : colors.textPrimary} />
              <Text style={[typography.label, { color: active ? colors.textOnDark : colors.textPrimary }]}>
                {FIELD_TYPES[type].label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <TextField
        label="Label"
        placeholder="Contoh: Password Supabase"
        value={field.label}
        onChangeText={(label) => onChange({ label })}
        error={error}
        autoCapitalize="sentences"
      />
      <TextField
        label="Nilai"
        placeholder={meta.multiline ? 'Tulis catatan…' : 'Isi nilai'}
        value={field.value}
        onChangeText={(value) => onChange({ value })}
        secret={field.is_secret && !meta.multiline}
        multiline={meta.multiline}
        keyboardType={meta.keyboard}
        autoCapitalize={field.type === 'text' || field.type === 'note' ? 'sentences' : 'none'}
        autoCorrect={field.type === 'text' || field.type === 'note'}
      />

      <View style={styles.footer}>
        <View style={styles.secretRow}>
          <Switch
            value={field.is_secret}
            onValueChange={(is_secret) => onChange({ is_secret })}
            trackColor={{ true: colors.ink, false: colors.border }}
            thumbColor={colors.surface}
            ios_backgroundColor={colors.border}
          />
          <Text style={[typography.caption, { color: colors.textSecondary }]}>Sembunyikan nilai</Text>
        </View>
        <View style={styles.tools}>
          <SmallIcon label="Pindah ke atas" disabled={isFirst} onPress={() => onMove(-1)}>
            <ArrowUp size={18} color={colors.textPrimary} />
          </SmallIcon>
          <SmallIcon label="Pindah ke bawah" disabled={isLast} onPress={() => onMove(1)}>
            <ArrowDown size={18} color={colors.textPrimary} />
          </SmallIcon>
          <SmallIcon label="Hapus field" onPress={onRemove}>
            <Trash2 size={18} color={colors.danger} />
          </SmallIcon>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, gap: spacing.md },
  types: { gap: spacing.xs + 2 },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeChipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  secretRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tools: { flexDirection: 'row', gap: spacing.xs },
  small: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
