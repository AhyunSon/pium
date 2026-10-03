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

/** 이 각도부터 물이 빠져나가기 시작, 이 각도에서 최대 */
const POUR_START_DEG = 38;
const POUR_FULL_DEG = 110;
const FULL_POUR_MS = 5200;
const HAPTIC_INTERVAL_MS = 320;
/** 화면 들어오면 이 시간 동안은 가만히. 든 자세로 맞춘 뒤 따라감 */
const SETTLE_MS = 700;

type PourOptions = {
  gxTarget: SharedValue<number>;
  gyTarget: SharedValue<number>;
  pourDeg: SharedValue<number>;
  enabled: boolean;
  onComplete: (pourDurationMs: number) => void;
};

type CompleteBox = { fn: (ms: number) => void };

export function usePour({ gxTarget, gyTarget, pourDeg, enabled, onComplete }: PourOptions) {
  const fill = useSharedValue(0);
  const gx = useSharedValue(0);
  const gy = useSharedValue(1);
  const gxVel = useSharedValue(0);
  const gyVel = useSharedValue(0);
  const phase = useSharedValue(0);
  const slosh = useSharedValue(0);
  const pressPour = useSharedValue(0);
  const strength = useSharedValue(0);
  const hapticAcc = useSharedValue(0);
  const done = useSharedValue(false);
  const pourMs = useSharedValue(0);
  const active = useSharedValue(false);
  const armed = useSharedValue(0);
  const settleAcc = useSharedValue(0);

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

  const tick = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);

  const finish = useCallback((ms: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    completeRef.current(Math.round(ms));
  }, []);

  useFrameCallback((info) => {
    const dt = Math.min(0.05, (info.timeSincePreviousFrame ?? 16) / 1000);

    if (armed.value < 1) {
      if (pressPour.value > 0.5) {
        armed.value = 1;
      } else {
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
    }

    let tx = gxTarget.value;
    let ty = gyTarget.value;
    // 센서 없이 길게 누르면 왼쪽으로 기울인 것처럼
    if (pressPour.value > 0.5) {
      tx += (-0.85 - tx) * 0.12;
      ty += (0.2 - ty) * 0.12;
    }

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

    const deg = pressPour.value > 0.5 ? POUR_FULL_DEG * 0.7 : pourDeg.value;
    // 남은 물이 적을수록 더 눕혀야 흐름. 컵 바닥의 마지막 한 모금처럼.
    const empty = fill.value * fill.value;
    const startDeg = POUR_START_DEG + empty * 50;
    const span = Math.max(20, POUR_FULL_DEG - startDeg);
    const sensor = Math.max(0, Math.min(1, (deg - startDeg) / span));
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

  const reset = useCallback(() => {
    runOnUI(() => {
      'worklet';
      fill.value = 0;
      done.value = false;
      pourMs.value = 0;
      hapticAcc.value = 0;
      pressPour.value = 0;
      gx.value = 0;
      gy.value = 1;
      gxVel.value = 0;
      gyVel.value = 0;
      slosh.value = 0;
      armed.value = 0;
      settleAcc.value = 0;
    })();
    setPercent(0);
  }, [fill, done, pourMs, hapticAcc, pressPour, gx, gy, gxVel, gyVel, slosh, armed, settleAcc]);

  const setPressPour = useCallback(
    (on: boolean) => {
      runOnUI((v: number) => {
        'worklet';
        pressPour.value = v;
      })(on ? 1 : 0);
    },
    [pressPour],
  );

  return { fill, gx, gy, phase, slosh, percent, pouring, reset, setPressPour };
}
