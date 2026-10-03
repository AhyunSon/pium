import { Image, ImageStyle, StyleProp } from 'react-native';

export type FlowerState = 'disconnected' | 'bloomed' | 'falling' | 'dropped';

const SOURCES: Record<FlowerState, number> = {
  disconnected: require('../../assets/images/flower-disconnected.png'),
  bloomed: require('../../assets/images/flower-bloomed.png'),
  falling: require('../../assets/images/flower-falling.png'),
  dropped: require('../../assets/images/flower-dropped.png'),
};

/** 시든 정도(0=활짝, 100=완전히 시듦)를 세 단계 그림으로 */
export function flowerStateFromWilt(wiltPercent: number | null): FlowerState {
  if (wiltPercent === null) return 'disconnected';
  if (wiltPercent < 34) return 'bloomed';
  if (wiltPercent < 67) return 'falling';
  return 'dropped';
}

export const FLOWER_COMMENT: Record<FlowerState, string> = {
  disconnected: 'FIUM의 현재 상태를 확인할 수 없어요',
  bloomed: '꽃이 활짝 피었어요',
  falling: '조금씩 시들고 있어요',
  dropped: '꽃이 많이 시들었어요',
};

export function FlowerImage({ state, style }: { state: FlowerState; style?: StyleProp<ImageStyle> }) {
  return <Image source={SOURCES[state]} resizeMode="contain" style={style} />;
}
