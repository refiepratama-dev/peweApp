import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow, spacing, typography } from '@/theme';

type ScreenHeaderProps = { title: string; right?: ReactNode; onBack?: () => void };

export function ScreenHeader({ title, right, onBack }: ScreenHeaderProps) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Kembali"
        hitSlop={8}
        onPress={onBack ?? (() => router.back())}
        style={({ pressed }) => [styles.back, shadow.soft, pressed && { opacity: 0.6 }]}
      >
        <ChevronLeft size={22} color={colors.textPrimary} />
      </Pressable>
      <Text style={[typography.heading, styles.title]} numberOfLines={1}>
        {title}
      </Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  back: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, color: colors.textPrimary },
});
