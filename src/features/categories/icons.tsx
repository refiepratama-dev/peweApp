import {
  Briefcase,
  Cloud,
  Code,
  CreditCard,
  Database,
  Folder,
  Globe,
  KeyRound,
  Mail,
  Server,
  Shield,
  Smartphone,
  Store,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { radius } from '@/theme';

/** Ikon yang bisa dipilih untuk kategori. Key disimpan di kolom categories.icon */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  folder: Folder,
  briefcase: Briefcase,
  store: Store,
  globe: Globe,
  database: Database,
  server: Server,
  cloud: Cloud,
  code: Code,
  smartphone: Smartphone,
  mail: Mail,
  'key-round': KeyRound,
  shield: Shield,
  'credit-card': CreditCard,
  users: Users,
};

export const CATEGORY_ICON_KEYS = Object.keys(CATEGORY_ICONS);

/** Palet warna kategori: netral dulu (sesuai tema monokrom), lalu aksen */
export const CATEGORY_COLORS = [
  '#0A0A0A',
  '#6B6B70',
  '#6366F1',
  '#0EA5E9',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#EC4899',
] as const;

type CategoryIconProps = { icon: string; color: string; size?: number };

/** Ikon dalam kotak berwarna lembut */
export function CategoryIcon({ icon, color, size = 40 }: CategoryIconProps) {
  const Icon = CATEGORY_ICONS[icon] ?? Folder;
  return (
    <View style={[styles.box, { width: size, height: size, backgroundColor: `${color}1A` }]}>
      <Icon size={size * 0.5} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
});
