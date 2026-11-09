import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/lib/auth/auth-provider';
import { colors } from '@/theme';

export default function AppLayout() {
  const { session } = useAuth();
  // Belum login → ke layar Masuk
  if (!session) return <Redirect href="/login" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'ios_from_right',
      }}
    />
  );
}
