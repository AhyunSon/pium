import { DeviceMotion } from 'expo-sensors';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { SharedValue, useSharedValue } from 'react-native-reanimated';

/**
 * 좌우 기울기(roll)를 라디안으로 넘겨 줍니다.
 * 양수 = 오른쪽이 아래로 기울어짐. 기기에서 방향이 반대로 보이면 TILT_SIGN만 뒤집으세요.
 */
const TILT_SIGN = Platform.OS === 'android' ? -1 : 1;

export type TiltState = {
  /** 목표 기울기(센서 원값). 물 애니메이션은 이 값을 스프링으로 따라갑니다. */
  tiltTarget: SharedValue<number>;
  available: boolean | null;
};

export function useTilt(enabled: boolean): TiltState {
  const tiltTarget = useSharedValue(0);
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
          const roll = Math.atan2(g.x, Math.sqrt(g.y * g.y + g.z * g.z));
          tiltTarget.value = roll * TILT_SIGN;
        });
      } catch {
        if (!cancelled) setAvailable(false);
      }
    })();

    return () => {
      cancelled = true;
      sub?.remove();
      tiltTarget.value = 0;
    };
  }, [enabled, tiltTarget]);

  return { tiltTarget, available };
}
