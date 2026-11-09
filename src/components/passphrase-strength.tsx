import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { validatePassphrase } from '@/lib/crypto';
import { colors, radius, spacing, typography } from '@/theme';

type Level = 0 | 1 | 2 | 3;

export function getPassphraseLevel(passphrase: string): { level: Level; label: string; hint?: string } {
  if (!passphrase) return { level: 0, label: '' };
  const check = validatePassphrase(passphrase);
  if (!check.ok) return { level: 1, label: 'Lemah', hint: check.message };
  return passphrase.trim().length >= 18 ? { level: 3, label: 'Kuat' } : { level: 2, label: 'Cukup' };
}

const levelColor = [colors.border, colors.danger, '#F5A524', colors.success] as const;

function Segment({ active, color }: { active: boolean; color: string }) {
  const style = useAnimatedStyle(() => ({
    backgroundColor: withTiming(active ? color : colors.border, { duration: 200 }),
  }));
  return <Animated.View style={[styles.segment, style]} />;
}

export function PassphraseStrength({ passphrase }: { passphrase: string }) {
  const { level, label, hint } = getPassphraseLevel(passphrase);
  const color = levelColor[level];

  return (
    <View style={styles.wrapper}>
      <View style={styles.bar}>
        {[1, 2, 3].map((i) => (
          <Segment key={i} active={level >= i} color={color} />
        ))}
      </View>
      {!!label && (
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          <Text style={[typography.label, { color }]}>{label}</Text>
          {hint ? ` · ${hint}` : ''}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  bar: { flexDirection: 'row', gap: spacing.xs },
  segment: { flex: 1, height: 4, borderRadius: radius.full },
});
