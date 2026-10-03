import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, SharedValue, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const SOURCES = [
  require('../../assets/images/flower-dropped.png'),
  require('../../assets/images/flower-falling.png'),
  require('../../assets/images/flower-bloomed.png'),
];

const CENTER_W = 267;
const CENTER_H = 325;
const STEP_MS = 1600;
const MOVE_MS = 880;

type Slot = { x: number; scale: number; opacity: number; z: number };

function slotOf(slot: number, sideX: number): Slot {
  'worklet';
  if (slot === 1) return { x: 0, scale: 1, opacity: 1, z: 3 };
  if (slot === 0) return { x: -sideX, scale: 0.56, opacity: 0.42, z: 1 };
  return { x: sideX, scale: 0.52, opacity: 0.32, z: 1 };
}

function mix(a: Slot, b: Slot, t: number): Slot {
  'worklet';
  return {
    x: a.x + (b.x - a.x) * t,
    scale: a.scale + (b.scale - a.scale) * t,
    opacity: a.opacity + (b.opacity - a.opacity) * t,
    z: t < 0.5 ? a.z : b.z,
  };
}

/** 오른쪽 → 왼쪽은 가운데를 지나지 않고 뒤로 사라졌다가 왼쪽에서 대기 */
function wrap(from: Slot, to: Slot, t: number): Slot {
  'worklet';
  if (t < 0.42) {
    const u = t / 0.42;
    return { x: from.x + 20 * u, scale: from.scale * (1 - 0.18 * u), opacity: from.opacity * (1 - u), z: 0 };
  }
  const u = (t - 0.42) / 0.58;
  return { x: to.x - 20 * (1 - u), scale: to.scale * (0.82 + 0.18 * u), opacity: to.opacity * u, z: 0 };
}

function BloomItem({
  index,
  step,
  sideX,
}: {
  index: number;
  step: SharedValue<number>;
  sideX: number;
}) {
  const style = useAnimatedStyle(() => {
    const fromI = Math.floor(step.value);
    const t = step.value - fromI;
    const fromSlot = (index + fromI) % 3;
    const toSlot = (index + fromI + 1) % 3;
    const from = slotOf(fromSlot, sideX);
    const to = slotOf(toSlot, sideX);
    const cur = fromSlot === 2 && toSlot === 0 ? wrap(from, to, t) : mix(from, to, t);
    return {
      zIndex: cur.z,
      opacity: cur.opacity,
      transform: [{ translateX: cur.x }, { scale: cur.scale }],
    };
  });

  return (
    <Animated.View style={[styles.item, style]}>
      <Animated.Image source={SOURCES[index]} resizeMode="contain" style={styles.img} />
    </Animated.View>
  );
}

export function BloomingCarousel() {
  const { width } = useWindowDimensions();
  const step = useSharedValue(0);
  const sideX = Math.min(width * 0.48, 190);

  useEffect(() => {
    const id = setInterval(() => {
      step.value = withTiming(Math.floor(step.value) + 1, {
        duration: MOVE_MS,
        easing: Easing.inOut(Easing.cubic),
      });
    }, STEP_MS);
    return () => clearInterval(id);
  }, [step]);

  return (
    <View style={[styles.stage, { width, marginHorizontal: -20 }]} pointerEvents="none">
      {SOURCES.map((_, index) => (
        <BloomItem key={index} index={index} step={step} sideX={sideX} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    height: CENTER_H,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'visible',
  },
  item: {
    position: 'absolute',
    width: CENTER_W,
    height: CENTER_H,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  img: { width: CENTER_W, height: CENTER_H },
});
