import { KeyRound, Link, Lock, Mail, StickyNote, Type, type LucideIcon } from 'lucide-react-native';
import type { KeyboardTypeOptions } from 'react-native';

export type FieldType = 'text' | 'email' | 'password' | 'url' | 'key' | 'note';

type FieldTypeMeta = {
  label: string;
  /** Label default saat tipe dipilih & label masih kosong */
  defaultLabel: string;
  icon: LucideIcon;
  /** Disembunyikan (••••) secara default */
  secret: boolean;
  keyboard: KeyboardTypeOptions;
  multiline?: boolean;
};

export const FIELD_TYPES: Record<FieldType, FieldTypeMeta> = {
  text: { label: 'Teks', defaultLabel: '', icon: Type, secret: false, keyboard: 'default' },
  email: { label: 'Email', defaultLabel: 'Email', icon: Mail, secret: false, keyboard: 'email-address' },
  password: { label: 'Password', defaultLabel: 'Password', icon: Lock, secret: true, keyboard: 'default' },
  url: { label: 'URL', defaultLabel: 'URL', icon: Link, secret: false, keyboard: 'url' },
  key: { label: 'Key / Token', defaultLabel: 'API Key', icon: KeyRound, secret: true, keyboard: 'default' },
  note: { label: 'Catatan', defaultLabel: 'Catatan', icon: StickyNote, secret: false, keyboard: 'default', multiline: true },
};

export const FIELD_TYPE_KEYS = Object.keys(FIELD_TYPES) as FieldType[];
