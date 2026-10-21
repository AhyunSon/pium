import { type Href, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { wiltPercentFromPos } from '../../src/ble/constants';
import { useFlower } from '../../src/ble/FlowerProvider';
import { Button } from '../../src/components/Button';
import { TopNav } from '../../src/components/TopNav';
import { useStore } from '../../src/data/store';
import { colors } from '../../src/theme/colors';
import { TiltPhoneImage } from '../../src/theme/icons';
import { type } from '../../src/theme/typography';
import { LiquidStage } from '../../src/water/LiquidStage';
import { usePour } from '../../src/water/usePour';
import { useTilt } from '../../src/water/useTilt';

export default function WaterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flower = useFlower();
  const { recordWater } = useStore();
  const [focused, setFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bloomed, setBloomed] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const sessionStartRef = useRef<number | null>(null);
  const pouringRef = useRef(false);
  const pouredRef = useRef(false);
  const edgesRef = useRef(0);
  const completingRef = useRef(false);
  const flowerRef = useRef(flower);
  const recordRef = useRef(recordWater);
  const bloomedRef = useRef(false);
  const bloomLogged = useRef(false);
  const pourRef = useRef<{ takeDurationMs: () => Promise<number> } | null>(null);
  flowerRef.current = flower;
  recordRef.current = recordWater;
  bloomedRef.current = bloomed;

  const inFlightRef = useRef(false);
  const pendingCmd = useRef<'WATER_START' | 'WATER_STOP' | null>(null);
  const lastCmd = useRef<'WATER_START' | 'WATER_STOP' | null>(null);

  const flushCmd = useCallback(async () => {
    if (inFlightRef.current) return;
    const next = pendingCmd.current;
    if (!next || next === lastCmd.current) {
      pendingCmd.current = null;
      return;
    }
    const f = flowerRef.current;
    if (f.connection !== 'connected') {
      pendingCmd.current = null;
      return;
    }
    pendingCmd.current = null;
    inFlightRef.current = true;
    try {
      // 펌웨어 command는 BLEWrite(응답 있음). withoutResponse는 로봇이 못 받음.
      await f.send(next);
      lastCmd.current = next;
    } catch {
      lastCmd.current = null;
    }
    inFlightRef.current = false;
    if (pendingCmd.current) void flushCmd();
  }, []);

  const sendCmd = useCallback(
    (command: 'WATER_START' | 'WATER_STOP') => {
      pendingCmd.current = command;
      void flushCmd();
    },
    [flushCmd],
  );

  const setMotor = useCallback(
    (next: boolean) => {
      if (next === pouringRef.current) return;
      pouringRef.current = next;
      edgesRef.current += 1;
      if (next) {
        pouredRef.current = true;
        if (sessionStartRef.current === null) sessionStartRef.current = flowerRef.current.pos;
        sendCmd('WATER_START');
        return;
      }
      sendCmd('WATER_STOP');
    },
    [sendCmd],
  );

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      if (sessionStartRef.current === null) sessionStartRef.current = flowerRef.current.pos;
      return () => {
        setFocused(false);
        if (pouringRef.current && !completingRef.current) setMotor(false);
      };
    }, [setMotor]),
  );

  const { gx, gy, pourDeg } = useTilt(focused);

  const onComplete = useCallback(async (givenMs?: number) => {
    if (completingRef.current) return;
    completingRef.current = true;
    setSubmitting(true);
    if (pouringRef.current) setMotor(false);
    const pourDurationMs =
      typeof givenMs === 'number' ? givenMs : ((await pourRef.current?.takeDurationMs()) ?? 0);
    const f = flowerRef.current;
    const pos = f.pos;
    recordRef.current({
      pos,
      posStart: sessionStartRef.current,
      posEnd: pos,
      wiltPercent: pos !== null ? wiltPercentFromPos(pos) : null,
      deviceConnected: f.connection === 'connected',
      pourDurationMs,
      startStopChanges: edgesRef.current,
      bloomed: bloomedRef.current,
    });
    router.replace('/water/done' as Href);
  }, [router, setMotor]);

  const pour = usePour({
    gxTarget: gx,
    gyTarget: gy,
    pourDeg,
    enabled: focused && !submitting,
    bloomed,
    onComplete,
  });
  pourRef.current = pour;

  useEffect(() => {
    setMotor(pour.pouring);
  }, [pour.pouring, setMotor]);

  useEffect(() => {
    if (!pouredRef.current) return;
    const up =
      flower.status?.homeOk === true ||
      flower.pos === 0 ||
      (flower.status?.raw.startsWith('WATER_FULL') ?? false);
    if (!up) return;
    setBloomed(true);
    if (bloomLogged.current) return;
    bloomLogged.current = true;
    const f = flowerRef.current;
    const pos = f.pos;
    void pourRef.current?.takeDurationMs().then((pourDurationMs) => {
      recordRef.current({
        mark: 'bloom',
        pos,
        posStart: sessionStartRef.current,
        posEnd: pos,
        wiltPercent: pos !== null ? wiltPercentFromPos(pos) : null,
        deviceConnected: f.connection === 'connected',
        pourDurationMs,
        startStopChanges: edgesRef.current,
        bloomed: true,
      });
    });
  }, [flower.pos, flower.status]);

  const started = pour.pouring || pour.percent >= 1;

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: Math.round(width), h: Math.round(height) });
  };

  const percentColor = pour.percent > 0 ? colors.primary[100] : colors.primary[300];

  return (
    <View style={styles.root}>
      <View style={styles.stage} onLayout={onLayout} pointerEvents="none">
        {size.w > 0 && size.h > 0 ? (
          <LiquidStage
            width={size.w}
            height={size.h}
            fill={pour.fill}
            gx={pour.gx}
            gy={pour.gy}
            phase={pour.phase}
            slosh={pour.slosh}
            bg={colors.primary[700]}
          />
        ) : null}
      </View>

      <View style={[styles.overlay, { paddingTop: insets.top }]} pointerEvents="box-none">
        <TopNav left="back" light onLeft={() => router.back()} />
        <View style={styles.contents}>
          <View style={styles.topBlock}>
            <Text style={styles.title}>휴대폰을 기울여{'\n'}FIUM에게 물을 주세요</Text>
            <Text style={styles.sub}>화면 속 물이 FIUM으로 전달돼요</Text>
            <View style={styles.level}>
              <Text style={[styles.waterLabel, { color: percentColor }]}>Water</Text>
            </View>
          </View>
          {started ? (
            <View style={styles.completeWrap} pointerEvents="box-none">
              <Button variant="pourComplete" label="완료하기" onPress={() => onComplete()} />
            </View>
          ) : (
            <View style={styles.tiltWrap}>
              <TiltPhoneImage width={95} height={73} />
            </View>
          )}
        </View>
        <View style={{ height: 56 + insets.bottom }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primary[700] },
  stage: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  overlay: { flex: 1 },
  contents: { flex: 1, paddingHorizontal: 20, paddingTop: 4, justifyContent: 'space-between' },
  topBlock: { width: '100%', gap: 96 },
  title: { ...type.title, color: colors.grey.white },
  sub: { ...type.bodyLarge, color: colors.grey.white, marginTop: -78 },
  level: { gap: 12 },
  waterLabel: { fontFamily: type.headingLight.fontFamily, fontSize: 24, lineHeight: 30, textTransform: 'capitalize' },
  tiltWrap: { alignSelf: 'flex-end', paddingBottom: 8 },
  completeWrap: { alignSelf: 'flex-end', paddingBottom: 8 },
});
