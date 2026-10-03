import { Canvas, Group, LinearGradient, Path, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { StyleSheet } from 'react-native';
import { SharedValue, useDerivedValue } from 'react-native-reanimated';
import { colors } from '../theme/colors';

type LiquidStageProps = {
  width: number;
  height: number;
  /** 0 = 가득, 1 = 다 줌 */
  fill: SharedValue<number>;
  gx: SharedValue<number>;
  gy: SharedValue<number>;
  phase: SharedValue<number>;
  slosh: SharedValue<number>;
  bg?: string;
};

function clipHalfPlane(poly: number[][], nx: number, ny: number, t: number) {
  'worklet';
  const out: number[][] = [];
  const n = poly.length;
  if (n === 0) return out;
  for (let i = 0; i < n; i++) {
    const cur = poly[i];
    const prev = poly[(i + n - 1) % n];
    const dCur = nx * cur[0] + ny * cur[1] - t;
    const dPrev = nx * prev[0] + ny * prev[1] - t;
    const curIn = dCur >= 0;
    const prevIn = dPrev >= 0;
    if (curIn) {
      if (!prevIn) {
        const u = dPrev / (dPrev - dCur);
        out.push([prev[0] + (cur[0] - prev[0]) * u, prev[1] + (cur[1] - prev[1]) * u]);
      }
      out.push(cur);
    } else if (prevIn) {
      const u = dPrev / (dPrev - dCur);
      out.push([prev[0] + (cur[0] - prev[0]) * u, prev[1] + (cur[1] - prev[1]) * u]);
    }
  }
  return out;
}

function polygonArea(poly: number[][]) {
  'worklet';
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const j = (i + 1) % poly.length;
    a += poly[i][0] * poly[j][1] - poly[j][0] * poly[i][1];
  }
  return Math.abs(a) * 0.5;
}

function thresholdForArea(w: number, h: number, nx: number, ny: number, target: number) {
  'worklet';
  const corners = [
    [0, 0],
    [w, 0],
    [w, h],
    [0, h],
  ];
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i < 4; i++) {
    const d = nx * corners[i][0] + ny * corners[i][1];
    if (d < lo) lo = d;
    if (d > hi) hi = d;
  }
  const want = Math.max(0, Math.min(w * h, target));
  if (want <= 1) return hi + 2;
  if (want >= w * h - 1) return lo - 2;
  for (let i = 0; i < 16; i++) {
    const mid = (lo + hi) * 0.5;
    const area = polygonArea(clipHalfPlane(corners, nx, ny, mid));
    if (area > want) lo = mid;
    else hi = mid;
  }
  return (lo + hi) * 0.5;
}

function useWaterPath(
  w: number,
  h: number,
  fill: SharedValue<number>,
  gx: SharedValue<number>,
  gy: SharedValue<number>,
  phase: SharedValue<number>,
  slosh: SharedValue<number>,
  offsetPhase: number,
  ampScale: number,
  areaBias: number,
) {
  return useDerivedValue(() => {
    const b = Skia.PathBuilder.Make();
    let vx = gx.value;
    let vy = gy.value;
    const wobble = slosh.value * 0.1 * Math.sin(phase.value + offsetPhase);
    const cs = Math.cos(wobble);
    const sn = Math.sin(wobble);
    const rx = vx * cs - vy * sn;
    const ry = vx * sn + vy * cs;
    const len = Math.hypot(rx, ry);
    const nx = len > 0.001 ? rx / len : 0;
    const ny = len > 0.001 ? ry / len : 1;

    const remaining = 1 - fill.value;
    const towardTop = Math.max(0, -ny);
    const leaned = Math.max(0, 1 - ny);
    const air = remaining * (0.1 * towardTop + 0.045 * leaned);
    const visual = Math.max(0.04, Math.min(1, remaining - air + areaBias));
    const amp = (6 + 22 * slosh.value) * ampScale;
    const t =
      thresholdForArea(w, h, nx, ny, visual * w * h) + amp * 0.35 * Math.sin(phase.value * 1.3 + offsetPhase);

    const poly = clipHalfPlane(
      [
        [0, 0],
        [w, 0],
        [w, h],
        [0, h],
      ],
      nx,
      ny,
      t,
    );
    if (poly.length < 3) return b.detach();
    b.moveTo(poly[0][0], poly[0][1]);
    for (let i = 1; i < poly.length; i++) b.lineTo(poly[i][0], poly[i][1]);
    b.close();
    return b.detach();
  });
}

export function LiquidStage({
  width,
  height,
  fill,
  gx,
  gy,
  phase,
  slosh,
  bg = colors.primary[700],
}: LiquidStageProps) {
  const clip = Skia.RRectXY(Skia.XYWHRect(0, 0, width, height), 0, 0);
  const back = useWaterPath(width, height, fill, gx, gy, phase, slosh, 1.4, 0.75, 0.03);
  const front = useWaterPath(width, height, fill, gx, gy, phase, slosh, 0, 1, 0);

  return (
    <Canvas style={[styles.canvas, { width, height }]}>
      <RoundedRect x={0} y={0} width={width} height={height} r={0} color={bg} />
      <Group clip={clip}>
        <Path path={back} color={colors.secondary[500]} opacity={0.45} />
        <Path path={front}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(0, height)}
            colors={[colors.secondary[300], colors.secondary[400]]}
          />
        </Path>
      </Group>
    </Canvas>
  );
}

const styles = StyleSheet.create({
  canvas: {},
});
