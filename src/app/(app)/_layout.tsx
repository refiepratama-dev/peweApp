import { Redirect, Stack } from 'expo-router';
import { VaultGate } from '@/features/vault/vault-gate';
import { useAuth } from '@/lib/auth/auth-provider';
import { VaultProvider } from '@/lib/vault/vault-provider';
import { colors } from '@/theme';

export default function AppLayout() {
  const { session } = useAuth();
  // Belum login → ke layar Masuk
  if (!session) return <Redirect href="/login" />;

  return (
    <VaultProvider>
      <VaultGate>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: 'ios_from_right',
          }}
        />
      </VaultGate>
    </VaultProvider>
  );
}
