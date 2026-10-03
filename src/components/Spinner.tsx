import { useEffect, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { LoadingIcon } from '../theme/icons';

/** 피그마 Icon/line-md:loading 을 빙글빙글 돌립니다 (연결 중 버튼). */
export function Spinner({ size = 18 }: { size?: number }) {
  const [spin] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Animated.View style={{ width: size, height: size, transform: [{ rotate }] }}>
      <LoadingIcon width={size} height={size} />
    </Animated.View>
  );
}
