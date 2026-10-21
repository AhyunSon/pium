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
import { BLOOMED_POUR_MS, FULL_POUR_MS } from '../ble/constants';

/** 이 각도부터 물이 빠져나가기 시작, 이 각도에서 최대 */
const POUR_START_DEG = 38;
const POUR_FULL_DEG = 110;
const HAPTIC_INTERVAL_MS = 320;
const HAPTIC_BLOOM_INTERVAL_MS = 720;
/** 화면 들어오면 이 시간 동안은 가만히. 든 자세로 맞춘 뒤 따라감 */
const SETTLE_MS = 700;

type PourOptions = {
  gxTarget: SharedValue<number>;
  gyTarget: SharedValue<number>;
  pourDeg: SharedValue<number>;
  enabled: boolean;
  /** 꽃이 다 핌. 물은 계속 줄 수 있고 진동만 약해짐 */
  bloomed?: boolean;
  onComplete: (pourDurationMs: number) => void;
};

type CompleteBox = { fn: (ms: number) => void };

export function usePour({ gxTarget, gyTarget, pourDeg, enabled, bloomed = false, onComplete }: PourOptions) {
  const fill = useSharedValue(0);
  const gx = useSharedValue(0);
  const gy = useSharedValue(1);
  const gxVel = useSharedValue(0);
  const gyVel = useSharedValue(0);
  const phase = useSharedValue(0);
  const slosh = useSharedValue(0);
  const strength = useSharedValue(0);
  const hapticAcc = useSharedValue(0);
  const pourMs = useSharedValue(0);
  const done = useSharedValue(false);
  const active = useSharedValue(false);
  const armed = useSharedValue(0);
  const settleAcc = useSharedValue(0);
  const bloomedSv = useSharedValue(0);

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
      if (on) {
        armed.value = 0;
        settleAcc.value = 0;
        gx.value = 0;
        gy.value = 1;
        gxVel.value = 0;
        gyVel.value = 0;
        slosh.value = 0;
      }
    })(enabled);
  }, [enabled, active, armed, settleAcc, gx, gy, gxVel, gyVel, slosh]);

  useEffect(() => {
    bloomedSv.value = bloomed ? 1 : 0;
  }, [bloomed, bloomedSv]);

  const tick = useCallback((soft: boolean) => {
    const style = soft ? Haptics.ImpactFeedbackStyle.Soft : Haptics.ImpactFeedbackStyle.Light;
    Haptics.impactAsync(style).catch(() => {});
  }, []);

  const finish = useCallback((ms: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    completeRef.current(Math.round(ms));
  }, []);

  useFrameCallback((info) => {
    const dt = Math.min(0.05, (info.timeSincePreviousFrame ?? 16) / 1000);

    if (armed.value < 1) {
      settleAcc.value += dt * 1000;
      gx.value = 0;
      gy.value = 1;
      gxVel.value = 0;
      gyVel.value = 0;
      slosh.value = 0;
      strength.value = 0;
      if (settleAcc.value < SETTLE_MS) return;
      gx.value = gxTarget.value;
      gy.value = gyTarget.value;
      armed.value = 1;
    }

    const tx = gxTarget.value;
    const ty = gyTarget.value;

    const stiffness = 80;
    const damping = 10;
    gxVel.value += (tx - gx.value) * stiffness * dt - gxVel.value * damping * dt;
    gyVel.value += (ty - gy.value) * stiffness * dt - gyVel.value * damping * dt;
    gx.value += gxVel.value * dt;
    gy.value += gyVel.value * dt;

    const energy = Math.min(1, Math.hypot(gxVel.value, gyVel.value) * 0.35);
    const tiltAmt = Math.min(1, Math.abs(gx.value));
    slosh.value += (Math.max(energy, tiltAmt * 0.4) - slosh.value) * Math.min(1, dt * 4);
    phase.value += dt * (2.2 + slosh.value * 6);

    if (!active.value || done.value) {
      strength.value = 0;
      return;
    }

    const deg = pourDeg.value;
    // 남은 물이 적을수록 더 눕혀야 흐름. 컵 바닥의 마지막 한 모금처럼.
    const empty = fill.value * fill.value;
    const startDeg = POUR_START_DEG + empty * 50;
    const span = Math.max(20, POUR_FULL_DEG - startDeg);
    const s = Math.max(0, Math.min(1, (deg - startDeg) / span));
    strength.value = s;

    if (s > 0) {
      pourMs.value += dt * 1000;
      const pourMsNow = bloomedSv.value > 0.5 ? BLOOMED_POUR_MS : FULL_POUR_MS;
      fill.value = Math.min(1, fill.value + (s * dt * 1000) / pourMsNow);
      hapticAcc.value += dt * 1000;
      const interval = bloomedSv.value > 0.5 ? HAPTIC_BLOOM_INTERVAL_MS : HAPTIC_INTERVAL_MS / (0.5 + s);
      if (hapticAcc.value >= interval) {
        hapticAcc.value = 0;
        runOnJS(tick)(bloomedSv.value > 0.5);
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

  const reset = useCallback(() => {
    runOnUI(() => {
      'worklet';
      fill.value = 0;
      done.value = false;
      pourMs.value = 0;
      hapticAcc.value = 0;
      gx.value = 0;
      gy.value = 1;
      gxVel.value = 0;
      gyVel.value = 0;
      slosh.value = 0;
      armed.value = 0;
      settleAcc.value = 0;
    })();
    setPercent(0);
  }, [fill, done, pourMs, hapticAcc, gx, gy, gxVel, gyVel, slosh, armed, settleAcc]);

  const takeDurationMs = useCallback(
    () =>
      new Promise<number>((resolve) => {
        runOnUI(() => {
          'worklet';
          runOnJS(resolve)(Math.round(pourMs.value));
        })();
      }),
    [pourMs],
  );

  return { fill, gx, gy, phase, slosh, percent, pouring, reset, takeDurationMs };
}
