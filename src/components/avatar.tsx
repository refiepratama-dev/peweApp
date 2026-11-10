import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, typography } from '@/theme';

/** Lingkaran hitam berisi inisial nama / email */
export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials =
    name
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('') || '?';
  return (
    <View style={[styles.avatar, { width: size, height: size }]}>
      <Text style={[size >= 56 ? typography.subheading : typography.label, { color: colors.textOnDark }]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { borderRadius: radius.full, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
});
