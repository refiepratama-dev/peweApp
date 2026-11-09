import * as Haptics from 'expo-haptics';
import { Check, Copy, ExternalLink, Eye, EyeOff } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { copyToClipboard } from '@/lib/clipboard';
import { colors, radius, spacing, typography } from '@/theme';
import type { DecryptedField } from './entries-api';
import { FIELD_TYPES } from './field-types';

function IconAction({ label, onPress, children }: { label: string; onPress: () => void; children: React.ReactNode }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [styles.action, pressed && { backgroundColor: colors.border }]}
    >
      {children}
    </Pressable>
  );
}

/** Satu baris field di halaman detail: label, nilai (bisa disembunyikan), salin, buka URL */
export function FieldRow({ field }: { field: DecryptedField }) {
  const meta = FIELD_TYPES[field.type] ?? FIELD_TYPES.text;
  const Icon = meta.icon;
  const [revealed, setRevealed] = useState(!field.is_secret);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function handleCopy() {
    await copyToClipboard(field.value, field.is_secret);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1500);
  }

  const display = field.error
    ? 'Gagal dibuka'
    : !revealed
      ? '••••••••••'
      : field.value || '—';

  return (
    <View style={styles.row}>
      <View style={styles.iconBox}>
        <Icon size={16} color={colors.textSecondary} />
      </View>
      <View style={styles.body}>
        <Text style={[typography.label, { color: colors.textSecondary }]} numberOfLines={1}>
          {field.label}
        </Text>
        <Text
          selectable={revealed && !field.error}
          style={[
            meta.multiline ? typography.body : typography.bodyMedium,
            { color: field.error ? colors.danger : colors.textPrimary },
            !revealed && styles.masked,
          ]}
          numberOfLines={meta.multiline && revealed ? undefined : 1}
        >
          {display}
        </Text>
        {copied && (
          <Animated.Text entering={ZoomIn.duration(150)} style={[typography.label, { color: colors.success }]}>
            {field.is_secret ? 'Disalin · terhapus otomatis 30 dtk' : 'Disalin'}
          </Animated.Text>
        )}
      </View>

      {!field.error && (
        <View style={styles.actions}>
          {field.is_secret && (
            <IconAction label={revealed ? 'Sembunyikan' : 'Tampilkan'} onPress={() => setRevealed((r) => !r)}>
              {revealed ? (
                <EyeOff size={18} color={colors.textPrimary} />
              ) : (
                <Eye size={18} color={colors.textPrimary} />
              )}
            </IconAction>
          )}
          {field.type === 'url' && !!field.value && (
            <IconAction
              label="Buka link"
              onPress={() =>
                Linking.openURL(/^https?:\/\//i.test(field.value) ? field.value : `https://${field.value}`)
              }
            >
              <ExternalLink size={18} color={colors.textPrimary} />
            </IconAction>
          )}
          {!!field.value && (
            <IconAction label="Salin" onPress={handleCopy}>
              {copied ? <Check size={18} color={colors.success} /> : <Copy size={18} color={colors.textPrimary} />}
            </IconAction>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingVertical: spacing.md },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  body: { flex: 1, gap: 2 },
  masked: { letterSpacing: 2 },
  actions: { flexDirection: 'row', gap: spacing.xs },
  action: { width: 36, height: 36, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
});
