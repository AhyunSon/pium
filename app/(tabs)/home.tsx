import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFlower } from '../../src/ble/FlowerProvider';
import { Button } from '../../src/components/Button';
import { Chip } from '../../src/components/Chip';
import { FLOWER_COMMENT, FlowerImage, flowerStateFromWilt } from '../../src/components/FlowerImage';
import { Screen } from '../../src/components/Screen';
import { Snackbar } from '../../src/components/Snackbar';
import { Spinner } from '../../src/components/Spinner';
import { colors } from '../../src/theme/colors';
import { ArrowIcon, CloseSmallIcon, WateringArrowIcon } from '../../src/theme/icons';
import { fonts, type } from '../../src/theme/typography';

export default function HomeScreen() {
  const router = useRouter();
  const flower = useFlower();

  const connected = flower.connection === 'connected';
  const busy = flower.connection === 'scanning' || flower.connection === 'connecting';
  const failed = ['error', 'notFound', 'poweredOff', 'unauthorized', 'unavailable'].includes(flower.connection);
  const flowerState = connected ? flowerStateFromWilt(flower.wiltPercent) : 'disconnected';
  const canWater = connected;
  const [snack, setSnack] = useState<string | null>(null);
  const hideSnack = useCallback(() => setSnack(null), []);

  const onConnect = async () => {
    try {
      const { state: next, error } = await flower.connect();
      if (next === 'poweredOff') setSnack('블루투스를 켜 주세요');
      else if (next === 'unauthorized') setSnack('블루투스와 위치 권한을 허용해 주세요');
      else if (next === 'notFound') setSnack(error || '화분을 찾지 못했어요. 가까이에서 다시 시도해 주세요');
      else if (next === 'error') setSnack(error || '연결에 실패했어요. 다시 시도해 주세요');
    } catch {
      setSnack('연결에 실패했어요. 다시 시도해 주세요');
    }
  };

  return (
    <View style={styles.page}>
      <Screen nav={{ left: 'logo' }} scroll>
        <View style={styles.statusCard}>
          <Image source={require('../../assets/images/bg-status-home.png')} style={styles.statusBg} resizeMode="stretch" />
          <View style={styles.flowerWrap}>
            <FlowerImage state={flowerState} style={styles.flower} />
          </View>
          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <Text style={styles.current}>Current FIUM</Text>
              {connected ? <Chip label="연결됨" /> : failed ? <Chip label="연결 실패" /> : null}
              <Text style={styles.comment}>{FLOWER_COMMENT[flowerState]}</Text>
            </View>
            {connected ? (
              <Button
                variant="pill"
                label="연결 끊기"
                icon={<CloseSmallIcon width={18} height={18} />}
                onPress={flower.disconnect}
                style={styles.connectBtn}
              />
            ) : busy ? (
              <Button variant="pillDark" label="연결 중" icon={<Spinner />} loading style={styles.connectBtn} />
            ) : (
              <Button
                variant="pill"
                label="연결하기"
                icon={<ArrowIcon width={18} height={18} />}
                onPress={onConnect}
                style={styles.connectBtn}
              />
            )}
          </View>
        </View>

        <View style={styles.waterCard}>
          <View style={styles.waterText}>
            <Text style={styles.watering}>Watering</Text>
            <Text style={styles.waterBody}>
              {!canWater ? 'FIUM에게 물을 주려면 연결이 필요해요' : 'FIUM에 물을 주세요.'}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/water')}
            disabled={!canWater}
            accessibilityRole="button"
            accessibilityLabel="물주기"
            accessibilityState={{ disabled: !canWater }}
            style={({ pressed }) => [
              styles.waterBtn,
              !canWater && styles.waterBtnDisabled,
              canWater && pressed && styles.waterBtnPressed,
            ]}
          >
            <WateringArrowIcon width={110} height={160} color={colors.secondary[400]} />
          </Pressable>
        </View>
        {flower.kind === 'mock' ? <Text style={styles.mock}>Expo Go: 가상 화분으로 동작 중</Text> : null}
      </Screen>
      <Snackbar message={snack} onHide={hideSnack} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  statusCard: {
    width: '100%',
    aspectRatio: 356 / 370,
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 32,
    justifyContent: 'center',
    alignItems: 'stretch',
    overflow: 'hidden',
  },
  statusBg: { ...StyleSheet.absoluteFill, width: undefined, height: undefined },
  flowerWrap: {
    flex: 1,
    aspectRatio: 173 / 200,
    alignSelf: 'flex-end',
    minHeight: 0,
  },
  flower: { width: '100%', height: '100%' },
  statusRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', width: '100%', gap: 12 },
  statusLeft: { flex: 1, minWidth: 0, gap: 12 },
  current: { ...type.bodyLarge, color: colors.primary[500] },
  comment: { ...type.bodyLarge, color: colors.primary[700] },
  connectBtn: { width: 112, flexShrink: 0 },
  waterCard: {
    marginTop: 8,
    backgroundColor: colors.primary[100],
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 99,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  waterText: { flex: 1, minHeight: 178, gap: 12 },
  watering: { ...type.bodyLarge, color: colors.secondary[400] },
  waterBtnDisabled: { opacity: 0.35 },
  waterBody: { fontFamily: fonts.medium, fontSize: 19, lineHeight: 25, color: colors.primary[700] },
  waterBtn: { width: 110, height: 160 },
  waterBtnPressed: { opacity: 0.85 },
  mock: { marginTop: 12, ...type.caption, color: colors.grey[300], textAlign: 'center' },
});
