import { Link, router } from 'expo-router';
import { Lock, Mail, User } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { AuthShell } from '@/components/auth-shell';
import { Button } from '@/components/ui/button';
import { TextField, type TextFieldRef } from '@/components/ui/text-field';
import { authErrorMessage } from '@/lib/auth/errors';
import { supabase } from '@/lib/supabase';
import { colors, typography } from '@/theme';

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

type Errors = { name?: string; email?: string; password?: string; confirm?: string; form?: string };

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<TextFieldRef>(null);
  const passwordRef = useRef<TextFieldRef>(null);
  const confirmRef = useRef<TextFieldRef>(null);

  async function handleRegister() {
    const next: Errors = {};
    if (name.trim().length < 2) next.name = 'Nama minimal 2 karakter';
    if (!isEmail(email.trim())) next.email = 'Format email belum benar';
    if (password.length < 8) next.password = 'Password minimal 8 karakter';
    if (confirm !== password) next.confirm = 'Konfirmasi password tidak sama';
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: name.trim() } },
    });
    setLoading(false);

    if (error) return setErrors({ form: authErrorMessage(error) });

    // Kalau "Confirm email" di Supabase aktif, sesi belum ada → user harus klik link di email dulu.
    if (!data.session) {
      Alert.alert('Cek email kamu', `Link konfirmasi sudah dikirim ke ${email.trim()}. Setelah dikonfirmasi, silakan masuk.`);
      router.replace('/login');
    }
    // Kalau sesi langsung ada, AuthProvider otomatis memindahkan ke app.
  }

  return (
    <AuthShell
      title="Daftar"
      subtitle="Buat akun, lalu minta owner tim menambahkan email kamu."
      footer={
        <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center' }]}>
          Sudah punya akun?{' '}
          <Link href="/login" style={[typography.bodyMedium, { color: colors.textPrimary }]}>
            Masuk
          </Link>
        </Text>
      }
    >
      <View style={{ gap: 14 }}>
        <TextField
          label="Nama"
          placeholder="Nama kamu"
          icon={<User size={18} color={colors.textSecondary} />}
          value={name}
          onChangeText={setName}
          error={errors.name}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
        />
        <TextField
          ref={emailRef}
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
          placeholder="Minimal 8 karakter"
          icon={<Lock size={18} color={colors.textSecondary} />}
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          secret
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
          onSubmitEditing={() => confirmRef.current?.focus()}
        />
        <TextField
          ref={confirmRef}
          label="Konfirmasi password"
          placeholder="Ulangi password"
          icon={<Lock size={18} color={colors.textSecondary} />}
          value={confirm}
          onChangeText={setConfirm}
          error={errors.confirm}
          secret
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={handleRegister}
        />
      </View>

      {errors.form && <Text style={[typography.caption, { color: colors.danger }]}>{errors.form}</Text>}

      <Button title="Buat akun" loading={loading} onPress={handleRegister} />
    </AuthShell>
  );
}
