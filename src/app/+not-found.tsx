import { Redirect } from 'expo-router';

// Rute yang tidak dikenal (mis. link lama) diarahkan ke beranda,
// lalu layout grup memutuskan: layar utama atau layar Masuk.
export default function NotFound() {
  return <Redirect href="/" />;
}
