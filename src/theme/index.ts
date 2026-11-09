// src/theme/index.ts
// Design tokens PEWE — monokrom hitam/putih + gradient, font Sora + Plus Jakarta Sans

import { Platform, TextStyle, ViewStyle } from 'react-native';

// ---------- WARNA ----------
export const colors = {
  bg: '#F2F2F4',          // latar aplikasi (abu sangat muda)
  surface: '#FFFFFF',     // kartu putih
  surfaceAlt: '#F7F7F8',  // kartu putih sekunder / input
  ink: '#0A0A0A',         // hitam utama (teks & tombol)
  inkSoft: '#1C1C1E',
  textPrimary: '#0A0A0A',
  textSecondary: '#6B6B70',
  textMuted: '#A1A1A6',
  textOnDark: '#FFFFFF',
  textOnDarkMuted: 'rgba(255,255,255,0.6)',
  border: '#E6E6E9',
  danger: '#E5484D',
  success: '#30A46C',
} as const;

// ---------- GRADIENT (pakai dengan expo-linear-gradient) ----------
export const gradients = {
  // kartu hitam glossy seperti kartu "CHASE" di referensi
  card: {
    colors: ['#3A3A3C', '#151516', '#000000'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  // header gelap (layar "Send money")
  header: {
    colors: ['#2C2C2E', '#0A0A0A'] as const,
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
  },
  // kartu putih lembut
  soft: {
    colors: ['#FFFFFF', '#F4F4F6'] as const,
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
} as const;

// ---------- FONT ----------
// Sora → heading (geometris, tegas)   |   Plus Jakarta Sans → teks (clean, nyaman dibaca)
export const fonts = {
  // Heading — Sora
  headingMedium: 'Sora_500Medium',
  headingSemibold: 'Sora_600SemiBold',
  headingBold: 'Sora_700Bold',
  headingExtrabold: 'Sora_800ExtraBold',
  // Teks — Plus Jakarta Sans
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
} as const;

// ---------- SKALA TIPOGRAFI ----------
export const typography = {
  display:    { fontFamily: fonts.headingBold,     fontSize: 32, lineHeight: 40, letterSpacing: -1 },   // angka besar, "Hello Refie"
  heading:    { fontFamily: fonts.headingSemibold, fontSize: 24, lineHeight: 32, letterSpacing: -0.6 }, // judul layar
  subheading: { fontFamily: fonts.headingSemibold, fontSize: 18, lineHeight: 24, letterSpacing: -0.3 }, // judul seksi (Field, Gambar, Dokumen)
  title:      { fontFamily: fonts.semibold,        fontSize: 16, lineHeight: 22, letterSpacing: -0.2 }, // judul kartu / item list
  body:       { fontFamily: fonts.regular,   fontSize: 15, lineHeight: 22 },                      // teks biasa
  bodyMedium: { fontFamily: fonts.medium,    fontSize: 15, lineHeight: 22 },                      // nilai field, tombol
  caption:    { fontFamily: fonts.regular,   fontSize: 13, lineHeight: 18 },                      // keterangan, tanggal
  label:      { fontFamily: fonts.medium,    fontSize: 12, lineHeight: 16, letterSpacing: 0.2 },  // label field, badge
} satisfies Record<string, TextStyle>;

// ---------- SPACING & RADIUS ----------
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 10, md: 16, lg: 24, xl: 32, full: 999 } as const;

// ---------- SHADOW lembut (seperti referensi) ----------
export const shadow = {
  soft: Platform.select<ViewStyle>({
    ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
    android: { elevation: 3 },
    default: {},
  }),
  strong: Platform.select<ViewStyle>({
    ios: { shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 12 } },
    android: { elevation: 8 },
    default: {},
  }),
} as const;

export const theme = { colors, gradients, fonts, typography, spacing, radius, shadow };
export type Theme = typeof theme;
