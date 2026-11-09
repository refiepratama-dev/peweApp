// Terjemahkan pesan error Supabase Auth ke bahasa Indonesia
export function authErrorMessage(error: { message?: string; code?: string } | null | undefined): string {
  const code = error?.code ?? '';
  const msg = (error?.message ?? '').toLowerCase();

  if (code === 'invalid_credentials' || msg.includes('invalid login credentials')) return 'Email atau password salah';
  if (code === 'email_not_confirmed' || msg.includes('email not confirmed')) return 'Email belum dikonfirmasi. Cek kotak masuk email kamu';
  if (code === 'user_already_exists' || msg.includes('already registered')) return 'Email ini sudah terdaftar. Silakan masuk';
  if (code === 'weak_password' || msg.includes('password should be')) return 'Password terlalu lemah (minimal 8 karakter)';
  if (code === 'over_email_send_rate_limit' || msg.includes('rate limit')) return 'Terlalu banyak percobaan. Coba lagi beberapa menit lagi';
  if (msg.includes('network') || msg.includes('fetch')) return 'Tidak ada koneksi internet';
  return error?.message || 'Terjadi kesalahan. Coba lagi';
}
