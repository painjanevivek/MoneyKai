import Svg, { Path, Rect } from 'react-native-svg';

type MoneyKaiBrandMarkProps = {
  size: number;
};

export function MoneyKaiBrandMark({ size }: MoneyKaiBrandMarkProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512" accessible={false}>
      <Rect width="512" height="512" fill="#000000" />
      <Path d="M249 15 249 132 146 234 18 234Z" fill="#ffffff" />
      <Path d="M271 15 271 132 373 234 501 234Z" fill="#ffffff" />
      <Path d="M18 256 146 256 249 359 249 483Z" fill="#ffffff" />
      <Path d="M501 256 373 256 271 359 271 483Z" fill="#ffffff" />
    </Svg>
  );
}
