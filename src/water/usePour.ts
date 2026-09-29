import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  runOnJS,
  runOnUI,
  SharedValue,
  useAnimatedReaction,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';

/** 이 각도(도)부터 붓기 시작, 이 각도에서 최대 */
const POUR_START_DEG = 32;
const POUR_FULL_DEG = 70;
/** 최대 세기로 붓을 때 가득 차는 데 걸리는 시간 */
const FULL_POUR_MS = 4200;
const HAPTIC_INTERVAL_MS = 320;

type PourOptions = {
  tiltTarget: SharedValue<number>;
  enabled: boolean;
  onComplete: (pourDurationMs: number) => void;
};

type CompleteBox = { fn: (ms: number) => void };

export function usePour({ tiltTarget, enabled, onComplete }: PourOptions) {
  const fill = useSharedValue(0);
  const tilt = useSharedValue(0);
  const tiltVel = useSharedValue(0);
  const phase = useSharedValue(0);
  const slosh = useSharedValue(0);
  const pressPour = useSharedValue(0);
  const strength = useSharedValue(0);
  const hapticAcc = useSharedValue(0);
  const done = useSharedValue(false);
  const pourMs = useSharedValue(0);
  const active = useSharedValue(false);

  const [percent, setPercent] = useState(0);
  const [pouring, setPouring] = useState(false);
  const completeRef = useRef<CompleteBox['fn']>(onComplete);

  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    runOnUI((on: boolean) => {
      'worklet';
      active.value = on;
    })(enabled);
  }, [enabled, active]);

  const tick = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);

  const finish = useCallback((ms: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    completeRef.current(Math.round(ms));
  }, []);

  useFrameCallback((info) => {
    const dt = Math.min(0.05, (info.timeSincePreviousFrame ?? 16) / 1000);

    // 기울기를 스프링으로 따라가며 살짝 넘치게 (찰랑)
    const stiffness = 90;
    const damping = 9;
    const acc = (tiltTarget.value - tilt.value) * stiffness - tiltVel.value * damping;
    tiltVel.value += acc * dt;
    tilt.value += tiltVel.value * dt;

    const energy = Math.min(1, Math.abs(tiltVel.value) * 0.9);
    slosh.value += (energy - slosh.value) * Math.min(1, dt * 4);
    phase.value += dt * (2.2 + slosh.value * 6);

    if (!active.value || done.value) {
      strength.value = 0;
      return;
    }

    const deg = (Math.abs(tilt.value) * 180) / Math.PI;
    const sensor = Math.max(0, Math.min(1, (deg - POUR_START_DEG) / (POUR_FULL_DEG - POUR_START_DEG)));
    const s = Math.max(sensor, pressPour.value * 0.7);
    strength.value = s;

    if (s > 0) {
      pourMs.value += dt * 1000;
      fill.value = Math.min(1, fill.value + (s * dt * 1000) / FULL_POUR_MS);
      hapticAcc.value += dt * 1000;
      if (hapticAcc.value >= HAPTIC_INTERVAL_MS / (0.5 + s)) {
        hapticAcc.value = 0;
        runOnJS(tick)();
      }
      if (fill.value >= 1) {
        done.value = true;
        runOnJS(finish)(pourMs.value);
      }
    }
  }, true);

  useAnimatedReaction(
    () => Math.round(fill.value * 100),
    (next, prev) => {
      if (next !== prev) runOnJS(setPercent)(next);
    },
  );

  useAnimatedReaction(
    () => strength.value > 0.02,
    (next, prev) => {
      if (next !== prev) runOnJS(setPouring)(next);
    },
  );

  /** 물주기를 새로 시작할 때 호출 */
  const reset = useCallback(() => {
    runOnUI(() => {
      'worklet';
      fill.value = 0;
      done.value = false;
      pourMs.value = 0;
      hapticAcc.value = 0;
      pressPour.value = 0;
    })();
    setPercent(0);
  }, [fill, done, pourMs, hapticAcc, pressPour]);

  /** 센서가 없을 때 화면을 꾹 눌러 붓기 */
  const setPressPour = useCallback(
    (on: boolean) => {
      runOnUI((v: number) => {
        'worklet';
        pressPour.value = v;
      })(on ? 1 : 0);
    },
    [pressPour],
  );

  return { fill, tilt, phase, slosh, percent, pouring, reset, setPressPour };
}
