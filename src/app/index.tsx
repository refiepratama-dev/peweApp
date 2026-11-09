// src/app/index.tsx
// Layar sementara untuk cek font, warna & gradient. Nanti diganti layar Home.
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius, shadow, spacing, typography } from '@/theme';

export default function Index() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[typography.body, { color: colors.textSecondary }]}>Hello</Text>
        <Text style={[typography.display, { color: colors.textPrimary }]}>Refie</Text>

        {/* Kartu gradient hitam */}
        <LinearGradient
          colors={gradients.card.colors}
          start={gradients.card.start}
          end={gradients.card.end}
          style={[styles.darkCard, shadow.strong]}
        >
          <Text style={[typography.label, { color: colors.textOnDarkMuted }]}>KLIEN</Text>
          <Text style={[typography.heading, { color: colors.textOnDark }]}>Toko Budi</Text>
          <Text style={[typography.bodyMedium, { color: colors.textOnDark }]}>•••• •••• 8160</Text>
        </LinearGradient>

        {/* Kartu putih + contoh skala tipografi */}
        <View style={[styles.card, shadow.soft]}>
          <Text style={[typography.heading, styles.ink]}>Heading — Sora 24</Text>
          <Text style={[typography.subheading, styles.ink]}>Subheading — Sora 18</Text>
          <Text style={[typography.title, styles.ink]}>Title — Jakarta 16</Text>
          <Text style={[typography.body, styles.ink]}>Body — Jakarta Regular 15</Text>
          <Text style={[typography.bodyMedium, styles.ink]}>Body Medium — Jakarta 15</Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>Caption — 13</Text>
          <Text style={[typography.label, { color: colors.textMuted }]}>LABEL — 12</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg, gap: spacing.lg },
  ink: { color: colors.textPrimary },
  darkCard: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
});
