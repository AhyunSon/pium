import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { colors } from '../theme/colors';

type SliderProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  leftLabel?: string;
  rightLabel?: string;
};

/** 의존성 없는 단순 슬라이더. 시든 정도(0~100) 입력에 씁니다. */
export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 5,
  leftLabel,
  rightLabel,
}: SliderProps) {
  const [width, setWidth] = useState(0);

  const update = (x: number) => {
    if (width <= 0) return;
    const ratio = Math.max(0, Math.min(1, x / width));
    const raw = min + ratio * (max - min);
    const snapped = Math.round(raw / step) * step;
    onChange(Math.max(min, Math.min(max, snapped)));
  };

  const pan = Gesture.Pan()
    .onBegin((e) => {
      runOnJS(update)(e.x);
    })
    .onUpdate((e) => {
      runOnJS(update)(e.x);
    });

  const ratio = (value - min) / (max - min);

  return (
    <View>
      <GestureDetector gesture={pan}>
        <View
          style={styles.track}
          onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
          hitSlop={{ top: 12, bottom: 12 }}
        >
          <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
          <View style={[styles.thumb, { left: Math.max(0, ratio * width - 14) }]} />
        </View>
      </GestureDetector>
      <View style={styles.labels}>
        <Text style={styles.side}>{leftLabel}</Text>
        <Text style={styles.value}>{value}%</Text>
        <Text style={styles.side}>{rightLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray[100],
    marginVertical: 14,
    justifyContent: 'center',
  },
  fill: {
    position: 'absolute',
    left: 0,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.yellow[300],
  },
  thumb: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.yellow[400],
  },
  labels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  side: { fontSize: 12, color: colors.textMuted, width: 80 },
  value: { fontSize: 15, color: colors.text, fontWeight: '600' },
});
