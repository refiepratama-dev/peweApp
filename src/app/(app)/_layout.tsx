import { Redirect, Stack } from 'expo-router';
import { CategoriesProvider } from '@/features/categories/categories-provider';
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
        <CategoriesProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
              animation: 'ios_from_right',
            }}
          >
            <Stack.Screen
              name="categories/form"
              options={{
                presentation: 'formSheet',
                sheetAllowedDetents: [0.85, 1],
                sheetGrabberVisible: true,
                sheetCornerRadius: 28,
                animation: 'slide_from_bottom',
              }}
            />
          </Stack>
        </CategoriesProvider>
      </VaultGate>
    </VaultProvider>
  );
}
