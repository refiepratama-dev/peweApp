import {
  BookOpenText,
  Calendar,
  Car,
  Coffee,
  Gamepad2,
  Heart,
  Hospital,
  Landmark,
  Music,
  Package,
  Plane,
  Scissors,
  Shirt,
  Zap,
  Briefcase,
  Building2,
  Camera,
  GraduationCap,
  HardDrive,
  House,
  Laptop,
  Megaphone,
  Monitor,
  Receipt,
  ShoppingCart,
  Truck,
  Utensils,
  Wallet,
  Wifi,
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

/**
 * Ikon yang bisa dipilih untuk kategori. Key disimpan di kolom categories.icon.
 * Jumlahnya 42 supaya grid pas penuh: 7 kolom di HP (6 baris), 14 kolom di tablet (3 baris).
 */
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
  building: Building2,
  'shopping-cart': ShoppingCart,
  wallet: Wallet,
  receipt: Receipt,
  megaphone: Megaphone,
  truck: Truck,
  utensils: Utensils,
  'graduation-cap': GraduationCap,
  house: House,
  monitor: Monitor,
  laptop: Laptop,
  'hard-drive': HardDrive,
  wifi: Wifi,
  camera: Camera,
  scissors: Scissors,
  shirt: Shirt,
  menu: BookOpenText,
  coffee: Coffee,
  package: Package,
  car: Car,
  plane: Plane,
  calendar: Calendar,
  heart: Heart,
  hospital: Hospital,
  landmark: Landmark,
  zap: Zap,
  music: Music,
  gamepad: Gamepad2,
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
  '#8B5CF6',
  '#14B8A6',
  '#84CC16',
  '#F97316',
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
