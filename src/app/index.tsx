// src/app/index.tsx
// Layar sementara untuk cek font, warna & gradient. Nanti diganti layar Home.
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { colors, gradients, radius, shadow, spacing, typography } from '@/theme';

type Status = 'checking' | 'ok' | 'no-schema' | 'error';

// Cek koneksi Supabase + apakah schema.sql sudah di-run
function useSupabaseStatus() {
  const [status, setStatus] = useState<Status>('checking');
  const [message, setMessage] = useState('');

  useEffect(() => {
    supabase
      .from('workspaces')
      .select('id', { head: true, count: 'exact' })
      .then(({ error }) => {
        if (!error) return setStatus('ok');
        setMessage(error.message);
        setStatus(error.code === 'PGRST205' || error.code === '42P01' ? 'no-schema' : 'error');
      });
  }, []);

  return { status, message };
}

const statusText: Record<Status, string> = {
  checking: 'Mengecek koneksi Supabase…',
  ok: 'Supabase terhubung, schema siap',
  'no-schema': 'Terhubung, tapi schema.sql belum di-run',
  error: 'Gagal terhubung ke Supabase',
};

export default function Index() {
  const { status, message } = useSupabaseStatus();
  const dotColor =
    status === 'ok' ? colors.success : status === 'checking' ? colors.textMuted : colors.danger;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[typography.body, { color: colors.textSecondary }]}>Hello</Text>
        <Text style={[typography.display, { color: colors.textPrimary }]}>Refie</Text>

        {/* Status koneksi Supabase */}
        <View style={[styles.status, shadow.soft]}>
          <View style={[styles.dot, { backgroundColor: dotColor }]} />
          <View style={{ flex: 1 }}>
            <Text style={[typography.bodyMedium, styles.ink]}>{statusText[status]}</Text>
            {!!message && (
              <Text style={[typography.caption, { color: colors.textSecondary }]}>{message}</Text>
            )}
          </View>
        </View>

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
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  dot: { width: 10, height: 10, borderRadius: radius.full },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
});
