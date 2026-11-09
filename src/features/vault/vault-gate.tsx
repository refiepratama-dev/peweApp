import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { useVault } from '@/lib/vault/vault-provider';
import { colors, spacing, typography } from '@/theme';
import { SetupWorkspaceScreen } from './setup-workspace-screen';
import { UnlockScreen } from './unlock-screen';

/** Isi app hanya tampil kalau vault sudah terbuka */
export function VaultGate({ children }: { children: ReactNode }) {
  const { status, error, refresh } = useVault();

  if (status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  }
  if (status === 'error') {
    return (
      <View style={[styles.center, { gap: spacing.md, padding: spacing.xl }]}>
        <Text style={[typography.subheading, { color: colors.textPrimary }]}>Gagal memuat tim</Text>
        <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center' }]}>{error}</Text>
        <Button title="Coba lagi" onPress={refresh} />
      </View>
    );
  }
  if (status === 'no-workspace') return <SetupWorkspaceScreen />;
  if (status === 'locked') return <UnlockScreen />;
  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
});
