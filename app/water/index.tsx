import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFlower } from '../../src/ble/FlowerProvider';
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
  const [size, setSize] = useState({ w: 0, h: 0 });

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  const { gx, gy, pourDeg, available } = useTilt(focused);

  const onComplete = useCallback(
    async (pourDurationMs: number) => {
      if (submitting) return;
      setSubmitting(true);
      const result = await flower.water();
      recordWater({
        wiltPos: result.waterPos,
        wiltPercent: result.wiltPercent,
        deviceConnected: result.connected,
        pourDurationMs,
      });
      setSubmitting(false);
      const posAfter = result.waterPos ?? flower.pos;
      const alreadyBloomed = posAfter === 0 || result.wiltPercent === 0;
      if (result.connected && !alreadyBloomed) {
        router.replace('/water/blooming');
      } else {
        router.replace('/water/bloomed');
      }
    },
    [flower, recordWater, router, submitting],
  );

  const pour = usePour({ gxTarget: gx, gyTarget: gy, pourDeg, enabled: focused && !submitting, onComplete });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: Math.round(width), h: Math.round(height) });
  };

  const percentColor = pour.percent > 0 ? colors.primary[100] : colors.primary[300];

  return (
    <View style={styles.root}>
      <Pressable
        style={styles.stage}
        onLayout={onLayout}
        onPressIn={() => pour.setPressPour(true)}
        onPressOut={() => pour.setPressPour(false)}
      >
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
      </Pressable>

      <View style={[styles.overlay, { paddingTop: insets.top }]} pointerEvents="box-none">
        <TopNav left="back" light onLeft={() => router.back()} />
        <View style={styles.contents}>
          <View style={styles.topBlock}>
            <Text style={styles.title}>휴대폰을 기울여{'\n'}FIUM에게 물을 주세요</Text>
            <Text style={styles.sub}>
              {available === false ? '화면을 길게 누르면 물이 차올라요' : '화면 속 물이 FIUM으로 전달돼요'}
            </Text>
            <View style={styles.level}>
              <Text style={[styles.waterLabel, { color: percentColor }]}>Watering</Text>
            </View>
          </View>
          <View style={styles.tiltWrap}>
            <TiltPhoneImage width={95} height={73} />
          </View>
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
  contents: { flex: 1, paddingHorizontal: 20, paddingTop: 4, justifyContent: 'space-between', alignItems: 'flex-end' },
  topBlock: { width: '100%', gap: 96 },
  title: { ...type.title, color: colors.grey.white },
  sub: { ...type.bodyLarge, color: colors.grey.white, marginTop: -78 },
  level: { gap: 12 },
  waterLabel: { fontFamily: type.headingLight.fontFamily, fontSize: 24, lineHeight: 30, textTransform: 'capitalize' },
  tiltWrap: { alignSelf: 'flex-end', paddingBottom: 8 },
});
