import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFlower } from '../../src/ble/FlowerProvider';
import { Button } from '../../src/components/Button';
import { Screen } from '../../src/components/Screen';
import { Title } from '../../src/components/Title';
import { colors } from '../../src/theme/colors';
import { BgBlooming } from '../../src/theme/icons';
import { BloomingCarousel } from '../../src/water/BloomingCarousel';

const BLOOM_WAIT_MS = 18000;

export default function BloomingScreen() {
  const router = useRouter();
  const flower = useFlower();

  useEffect(() => {
    if (flower.connection !== 'connected') {
      const t = setTimeout(() => router.replace('/water/bloomed'), 1600);
      return () => clearTimeout(t);
    }
    if (flower.lastBloomedAt !== null) {
      router.replace('/water/bloomed');
    }
  }, [flower.lastBloomedAt, flower.connection, router]);

  useEffect(() => {
    const t = setTimeout(() => router.replace('/water/bloomed'), BLOOM_WAIT_MS);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <Screen
      safeBottom
      nav={{ left: 'back', onLeft: () => router.replace('/home') }}
      footer={<Button label="오늘 기록 남기기" disabled />}
      contentStyle={styles.content}
    >
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <BgBlooming width="100%" height="100%" preserveAspectRatio="none" />
      </View>
      <Title
        align="center"
        title="FIUM이 피어나고 있어요"
        subtitle="완전히 피어날 때까지 잠시만 기다려주세요"
        subtitleColor={colors.grey[400]}
      />
      <BloomingCarousel />
      <View />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, alignItems: 'center', justifyContent: 'space-between', overflow: 'visible' },
});
