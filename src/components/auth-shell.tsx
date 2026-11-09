import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Logo } from '@/components/logo';
import { colors, gradients, radius, shadow, spacing, typography } from '@/theme';

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Teks di kartu hitam (default: tagline Pewe) */
  heroText?: string;
};

const enter = (delay: number) => FadeInDown.duration(450).delay(delay).easing(Easing.out(Easing.cubic));

/**
 * Kerangka layar Login/Daftar.
 * HP portrait: kartu hitam di atas, form di bawah.
 * Tablet / landscape lebar: kartu hitam di kiri, form di kanan.
 */
export function AuthShell({ title, subtitle, children, footer, heroText }: AuthShellProps) {
  const { width } = useWindowDimensions();
  const wide = width >= 720;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, wide && styles.scrollWide]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.container, wide && styles.containerWide]}>
            <Animated.View entering={enter(0)} style={[wide && styles.flex]}>
              <LinearGradient
                colors={gradients.header.colors}
                start={gradients.header.start}
                end={gradients.header.end}
                style={[styles.hero, wide && styles.heroWide, shadow.strong]}
              >
                <Logo size={52} />
                <View style={styles.heroText}>
                  <Text style={[typography.display, { color: colors.textOnDark }]}>Pewe</Text>
                  <Text style={[typography.body, { color: colors.textOnDarkMuted }]}>
                    {heroText ?? 'Simpan akun, password & key klien tim kamu, terenkripsi.'}
                  </Text>
                </View>
              </LinearGradient>
            </Animated.View>

            <Animated.View entering={enter(80)} style={[styles.form, wide && styles.formWide]}>
              <View style={styles.titleBlock}>
                <Text style={[typography.heading, { color: colors.textPrimary }]}>{title}</Text>
                <Text style={[typography.body, { color: colors.textSecondary }]}>{subtitle}</Text>
              </View>
              {children}
              {footer}
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, padding: spacing.lg },
  scrollWide: { justifyContent: 'center' },
  container: { width: '100%', maxWidth: 480, alignSelf: 'center', gap: spacing.xl },
  containerWide: { maxWidth: 960, flexDirection: 'row', alignItems: 'stretch' },
  hero: { borderRadius: radius.xl, padding: spacing.xl, gap: spacing.xl, minHeight: 220, justifyContent: 'space-between' },
  heroWide: { flex: 1, minHeight: 420 },
  heroText: { gap: spacing.sm },
  form: { gap: spacing.lg },
  formWide: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg },
  titleBlock: { gap: spacing.xs },
});
