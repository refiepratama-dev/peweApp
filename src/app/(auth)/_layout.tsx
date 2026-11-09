import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/lib/auth/auth-provider';
import { colors } from '@/theme';

export const unstable_settings = { initialRouteName: 'login' };

export default function AuthLayout() {
  const { session } = useAuth();
  // Sudah login → ke layar utama
  if (session) return <Redirect href="/" />;

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
