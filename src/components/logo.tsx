import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

const P_PATH =
  'M36.5 14H67.5C73.299 14 78 18.701 78 24.5V56H39V87H32.5C28.9101 87 26 84.0899 26 80.5V24.5C26 18.701 30.701 14 36.5 14ZM39 27H64V44H39Z';

type LogoProps = {
  size?: number;
  /** "tile" = kotak gradient + P putih (ikon app), "mark" = huruf P saja */
  variant?: 'tile' | 'mark';
  color?: string;
};

export function Logo({ size = 56, variant = 'tile', color = '#FFFFFF' }: LogoProps) {
  if (variant === 'mark') {
    return (
      <Svg width={size * (52 / 73)} height={size} viewBox="26 14 52 73">
        <Path d={P_PATH} fill={color} fillRule="evenodd" />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="pewe-bg" x1="77" y1="56.5" x2="50" y2="90.5" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#3B3B3B" />
          <Stop offset="1" stopColor="#262626" />
        </LinearGradient>
      </Defs>
      <Rect width="100" height="100" rx="24" fill="url(#pewe-bg)" />
      <Path d={P_PATH} fill="#FFFFFF" fillRule="evenodd" />
    </Svg>
  );
}
