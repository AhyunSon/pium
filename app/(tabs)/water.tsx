import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { connectionLabel } from '../../src/ble/connectionText';
import { useFlower } from '../../src/ble/FlowerProvider';
import { Button } from '../../src/components/Button';
import { Screen } from '../../src/components/Screen';
import { useStore } from '../../src/data/store';
import { colors } from '../../src/theme/colors';
import { LiquidStage } from '../../src/water/LiquidStage';
import { usePour } from '../../src/water/usePour';
import { useTilt } from '../../src/water/useTilt';

export default function WaterScreen() {
  const router = useRouter();
  const flower = useFlower();
  const { recordWater } = useStore();
  const [focused, setFocused] = useState(false);
  const [armed, setArmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => {
        setFocused(false);
        setArmed(false);
      };
    }, []),
  );

  const { tiltTarget, available } = useTilt(focused);

  const onComplete = useCallback(
    async (pourDurationMs: number) => {
      if (submitting) return;
      setSubmitting(true);
      const result = await flower.water();
      const event = recordWater({
        wiltPos: result.waterPos,
        wiltPercent: result.wiltPercent,
        deviceConnected: result.connected,
        pourDurationMs,
      });
      setSubmitting(false);
      setArmed(false);
      router.push({
        pathname: '/bloom',
        params: {
          wilt: event.wiltPercent === null ? '' : String(event.wiltPercent),
          connected: result.connected ? '1' : '0',
        },
      });
    },
    [flower, recordWater, router, submitting],
  );

  const pour = usePour({ tiltTarget, enabled: focused && armed && !submitting, onComplete });

  const connected = flower.connection === 'connected';
  const busy = flower.connection === 'scanning' || flower.connection === 'connecting';

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: Math.round(width), h: Math.round(height) });
  };

  return (
    <Screen
      title="물주기"
      hint={armed ? '폰을 옆으로 기울여 천천히 부어 주세요.' : '목표 행동을 마쳤을 때만 눌러 주세요.'}
      right={
        <View style={styles.conn}>
          <View style={[styles.dot, connected && !flower.stale && styles.dotOn]} />
          <Text style={styles.connText}>{connectionLabel(flower.connection, flower.stale)}</Text>
        </View>
      }
    >
      {!connected ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            화분과 연결되어 있지 않습니다. 이대로 물을 주면 기록만 남고 꽃은 피지 않습니다.
          </Text>
          <Button small variant="secondary" label={busy ? '찾는 중' : '연결'} loading={busy} onPress={flower.connect} />
        </View>
      ) : null}

      <Pressable
        style={styles.stageWrap}
        onLayout={onLayout}
        onPressIn={() => armed && pour.setPressPour(true)}
        onPressOut={() => pour.setPressPour(false)}
        disabled={!armed}
      >
        {size.w > 0 && size.h > 0 ? (
          <LiquidStage
            width={size.w}
            height={size.h}
            fill={pour.fill}
            tilt={pour.tilt}
            phase={pour.phase}
            slosh={pour.slosh}
          />
        ) : null}
        <View style={styles.overlay} pointerEvents="none">
          {armed ? (
            <>
              <Text style={styles.percent}>{pour.percent}%</Text>
              <Text style={styles.overlayHint}>
                {pour.pouring ? '붓는 중' : available === false ? '화면을 꾹 눌러 부어 주세요' : '기울이면 물이 흐릅니다'}
              </Text>
            </>
          ) : (
            <Text style={styles.overlayIdle}>오늘의 행동을 마쳤나요?</Text>
          )}
        </View>
      </Pressable>

      <View style={styles.actions}>
        {armed ? (
          <Button variant="ghost" label="그만두기" onPress={() => setArmed(false)} disabled={submitting} />
        ) : (
          <Button
            label="물주기 시작"
            onPress={() => {
              pour.reset();
              setArmed(true);
            }}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  conn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gray[200] },
  dotOn: { backgroundColor: colors.blue[300] },
  connText: { fontSize: 12, color: colors.textMuted },
  banner: {
    backgroundColor: colors.gray[50],
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    gap: 10,
  },
  bannerText: { fontSize: 13, lineHeight: 20, color: colors.textMuted },
  stageWrap: { flex: 1, minHeight: 260, borderRadius: 28, overflow: 'hidden', backgroundColor: colors.blue[600] },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  percent: { fontSize: 56, fontWeight: '300', color: colors.blue[50], letterSpacing: -1 },
  overlayHint: { marginTop: 8, fontSize: 14, color: colors.blue[100] },
  overlayIdle: { fontSize: 17, color: colors.blue[100], textAlign: 'center' },
  actions: { paddingTop: 16, paddingBottom: 8 },
});
