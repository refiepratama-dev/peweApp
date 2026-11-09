import { Link } from 'expo-router';
import { ArrowRight, Lock, Mail } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { AuthShell } from '@/components/auth-shell';
import { Button } from '@/components/ui/button';
import { TextField, type TextFieldRef } from '@/components/ui/text-field';
import { authErrorMessage } from '@/lib/auth/errors';
import { supabase } from '@/lib/supabase';
import { colors, typography } from '@/theme';

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<TextFieldRef>(null);

  async function handleLogin() {
    const next: typeof errors = {};
    if (!isEmail(email.trim())) next.email = 'Format email belum benar';
    if (!password) next.password = 'Password wajib diisi';
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    // Kalau sukses, AuthProvider menerima sesi baru dan router otomatis pindah ke app.
    if (error) setErrors({ form: authErrorMessage(error) });
  }

  return (
    <AuthShell
      title="Masuk"
      subtitle="Masuk dengan akun tim kamu."
      footer={
        <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center' }]}>
          Belum punya akun?{' '}
          <Link href="/register" style={[typography.bodyMedium, { color: colors.textPrimary }]}>
            Daftar
          </Link>
        </Text>
      }
    >
      <View style={{ gap: 14 }}>
        <TextField
          label="Email"
          placeholder="nama@email.com"
          icon={<Mail size={18} color={colors.textSecondary} />}
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <TextField
          ref={passwordRef}
          label="Password"
          placeholder="Password akun"
          icon={<Lock size={18} color={colors.textSecondary} />}
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          secret
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={handleLogin}
        />
      </View>

      {errors.form && <Text style={[typography.caption, { color: colors.danger }]}>{errors.form}</Text>}

      <Button
        title="Masuk"
        loading={loading}
        onPress={handleLogin}
        icon={<ArrowRight size={18} color={colors.textOnDark} />}
      />
    </AuthShell>
  );
}
