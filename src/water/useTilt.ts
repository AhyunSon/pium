import { DeviceMotion } from 'expo-sensors';
import { useEffect, useState } from 'react';
import { SharedValue, useSharedValue } from 'react-native-reanimated';

/**
 * 좌우 기울기(roll)만 씁니다. 앞뒤·책상 위는 무시.
 * 0° = 세움, 90° = 옆으로 눕힘, 120° = 그 너머.
 * 왼쪽이 아래로 가면 물이 왼쪽으로 모임 → 수면(수평)은 오른쪽에.
 */
const G = DeviceMotion.Gravity || 9.80665;
const FOLLOW = 0.28;
/** 책상 위처럼 화면이 하늘을 보면 좌우 성분이 거의 없음 */
const FLAT_G = 0.35 * G;

export type TiltState = {
  /** 화면 좌표 중력. +X 오른쪽, +Y 아래(물이 모이는 쪽). */
  gx: SharedValue<number>;
  gy: SharedValue<number>;
  /** |좌우 각도| 0~180 */
  pourDeg: SharedValue<number>;
  available: boolean | null;
};

export function useTilt(enabled: boolean): TiltState {
  const gx = useSharedValue(0);
  const gy = useSharedValue(1);
  const pourDeg = useSharedValue(0);
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let sub: { remove: () => void } | null = null;
    let cancelled = false;

    (async () => {
      try {
        const ok = await DeviceMotion.isAvailableAsync();
        if (cancelled) return;
        if (!ok) {
          setAvailable(false);
          return;
        }
        const perm = await DeviceMotion.requestPermissionsAsync();
        if (cancelled) return;
        if (!perm.granted) {
          setAvailable(false);
          return;
        }
        setAvailable(true);
        DeviceMotion.setUpdateInterval(40);
        sub = DeviceMotion.addListener((m) => {
          const g = m.accelerationIncludingGravity;
          if (!g) return;

          const inPlane = Math.hypot(g.x, g.y);
          if (inPlane < FLAT_G) {
            gx.value += (0 - gx.value) * FOLLOW;
            gy.value += (1 - gy.value) * FOLLOW;
            pourDeg.value += (0 - pourDeg.value) * FOLLOW;
            return;
          }

          // 세움: (0, -G) → 0°. 왼쪽 아래: g.x < 0. 90° 넘어가면 g.y가 +로.
          const signed = (Math.atan2(g.x, -g.y) * 180) / Math.PI;
          const deg = Math.min(150, Math.abs(signed));

          // 물은 낮은 쪽. 왼쪽이 아래면 g.x < 0 → gx < 0 → 왼쪽 모임, 수평은 오른쪽.
          let targetX = g.x / inPlane;
          let targetY = -g.y / inPlane;
          if (Math.abs(targetX) < 0.08) targetX = 0;

          gx.value += (targetX - gx.value) * FOLLOW;
          gy.value += (targetY - gy.value) * FOLLOW;
          pourDeg.value += (deg - pourDeg.value) * FOLLOW;
        });
      } catch {
        if (!cancelled) setAvailable(false);
      }
    })();

    return () => {
      cancelled = true;
      sub?.remove();
      gx.value = 0;
      gy.value = 1;
      pourDeg.value = 0;
    };
  }, [enabled, gx, gy, pourDeg]);

  return { gx, gy, pourDeg, available };
}
