import { Canvas, Group, LinearGradient, Path, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { StyleSheet } from 'react-native';
import { SharedValue, useDerivedValue } from 'react-native-reanimated';
import { colors } from '../theme/colors';

type Surface = {
  width: number;
  height: number;
  fill: SharedValue<number>;
  tilt: SharedValue<number>;
  phase: SharedValue<number>;
  slosh: SharedValue<number>;
};

type LiquidStageProps = Surface;

const SEGMENTS = 28;
const RADIUS = 28;
const MAX_TAN = Math.tan((62 * Math.PI) / 180);

function useSurfacePath(s: Surface, offsetPhase: number, ampScale: number, yOffset: number) {
  const { width, height, fill, tilt, phase, slosh } = s;
  return useDerivedValue(() => {
    const p = Skia.Path.Make();
    const baseY = height * (1 - fill.value) + yOffset;
    const slope = Math.max(-MAX_TAN, Math.min(MAX_TAN, Math.tan(tilt.value)));
    const amp = (3 + 14 * slosh.value) * ampScale;
    const k = (Math.PI * 2 * 1.6) / width;

    const yAt = (x: number) =>
      baseY + (x - width / 2) * slope + amp * Math.sin(k * x + phase.value + offsetPhase);

    p.moveTo(-40, yAt(-40));
    for (let i = 1; i <= SEGMENTS; i++) {
      const x = (i / SEGMENTS) * (width + 80) - 40;
      p.lineTo(x, yAt(x));
    }
    p.lineTo(width + 40, height + 40);
    p.lineTo(-40, height + 40);
    p.close();
    return p;
  });
}

export function LiquidStage(props: LiquidStageProps) {
  const { width, height } = props;
  const clip = Skia.RRectXY(Skia.XYWHRect(0, 0, width, height), RADIUS, RADIUS);
  const back = useSurfacePath(props, 1.4, 0.8, -6);
  const front = useSurfacePath(props, 0, 1, 0);

  return (
    <Canvas style={[styles.canvas, { width, height }]}>
      <RoundedRect x={0} y={0} width={width} height={height} r={RADIUS} color={colors.blue[600]} />
      <Group clip={clip}>
        <Path path={back} color={colors.blue[400]} opacity={0.55} />
        <Path path={front}>
          <LinearGradient start={vec(0, 0)} end={vec(0, height)} colors={[colors.blue[200], colors.blue[300]]} />
        </Path>
      </Group>
    </Canvas>
  );
}

const styles = StyleSheet.create({
  canvas: { borderRadius: RADIUS },
});
