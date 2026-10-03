import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFlower } from '../../src/ble/FlowerProvider';
import { Button } from '../../src/components/Button';
import { Chip } from '../../src/components/Chip';
import { FLOWER_COMMENT, FlowerImage, flowerStateFromWilt } from '../../src/components/FlowerImage';
import { Screen } from '../../src/components/Screen';
import { Snackbar } from '../../src/components/Snackbar';
import { Spinner } from '../../src/components/Spinner';
import { useStore } from '../../src/data/store';
import { studyDay, toDateKey } from '../../src/data/time';
import { STUDY_DAYS } from '../../src/data/types';
import { colors } from '../../src/theme/colors';
import { ArrowIcon, BgStatusCard, CloseSmallIcon, WateringArrowIcon } from '../../src/theme/icons';
import { fonts, type } from '../../src/theme/typography';

const pad2 = (n: number) => String(n).padStart(2, '0');

export default function HomeScreen() {
  const router = useRouter();
  const { state, todayWater } = useStore();
  const flower = useFlower();
  const day = state.profile ? studyDay(state.profile.studyStartDate, toDateKey()) : null;

  const connected = flower.connection === 'connected';
  const busy = flower.connection === 'scanning' || flower.connection === 'connecting';
  const failed = ['error', 'notFound', 'poweredOff', 'unauthorized', 'unavailable'].includes(flower.connection);
  const flowerState = connected ? flowerStateFromWilt(flower.wiltPercent) : 'disconnected';
  const canWater = connected;
  const waterDone = canWater && todayWater.length > 0 && flowerState === 'bloomed';
  const [snack, setSnack] = useState<string | null>(null);
  const hideSnack = useCallback(() => setSnack(null), []);

  const onConnect = async () => {
    const next = await flower.connect();
    if (next === 'poweredOff') setSnack('블루투스를 켜 주세요');
  };

  return (
    <View style={styles.page}>
      <Screen nav={{ left: 'logo', rightText: day ? `DAY ${pad2(day)} / ${pad2(STUDY_DAYS)}` : undefined }} scroll>
      {/* 상태 카드 */}
      <View style={styles.statusCard}>
        <View style={StyleSheet.absoluteFill}>
          <BgStatusCard width="100%" height="100%" preserveAspectRatio="none" />
        </View>
        <View style={styles.habitBlock}>
          <Text style={styles.habitKicker}>Today&apos;s Habit</Text>
          <Text style={styles.habit} numberOfLines={1} ellipsizeMode="tail">
            {state.profile?.habit ?? ''}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <View style={styles.statusLeft}>
            <View style={styles.currentRow}>
              <Text style={styles.current}>Current FIUM</Text>
              {connected ? <Chip label="연결됨" /> : failed ? <Chip label="연결 실패" /> : null}
            </View>
            <Text style={styles.comment}>{FLOWER_COMMENT[flowerState]}</Text>
          </View>
          <View style={styles.statusRight}>
            <View style={styles.flowerWrap}>
              <FlowerImage state={flowerState} style={styles.flower} />
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
      </View>

      {/* Watering 카드 */}
      <View style={styles.waterCard}>
        <View style={styles.waterText}>
          <View style={styles.waterHead}>
            <Text style={styles.watering}>Watering</Text>
            {waterDone ? <Chip label="완료됨" tone="blue" /> : null}
          </View>
          <Text style={styles.waterBody}>
            {!canWater ? (
              'FIUM에게 물을 주려면 연결이 필요해요'
            ) : waterDone ? (
              <>
                오늘의 물주기를 <Text style={styles.bold}>완료</Text>했어요.
              </>
            ) : (
              <>
                오늘의 습관을 <Text style={styles.bold}>완료</Text>했다면 FIUM에 <Text style={styles.bold}>물</Text>을 주세요.
              </>
            )}
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
          <WateringArrowIcon
            width={110}
            height={160}
            color={waterDone ? colors.secondary[300] : colors.secondary[400]}
          />
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
    aspectRatio: 362 / 376,
    padding: 16,
    justifyContent: 'space-between',
  },
  habitBlock: { alignItems: 'flex-end', gap: 12, width: '100%' },
  habitKicker: { fontFamily: fonts.semiBold, fontSize: 13.85, lineHeight: 17, color: colors.primary[500] },
  habit: {
    ...type.title,
    color: colors.primary[700],
    textAlign: 'right',
    width: '100%',
    paddingLeft: 4,
  },
  statusRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 16, width: '100%' },
  statusLeft: { flex: 1, minWidth: 0, gap: 8 },
  currentRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  current: { ...type.bodyLarge, color: colors.primary[500] },
  comment: { ...type.bodyLarge, color: colors.primary[700] },
  statusRight: { flex: 1, minWidth: 0, alignItems: 'flex-end', gap: 8 },
  flowerWrap: { alignSelf: 'stretch', aspectRatio: 173 / 200 },
  flower: { width: '100%', height: '100%' },
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
  waterHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  watering: { ...type.bodyLarge, color: colors.secondary[400] },
  waterBtnDisabled: { opacity: 0.35 },
  waterBody: { fontFamily: fonts.medium, fontSize: 19, lineHeight: 25, color: colors.primary[700] },
  bold: { fontFamily: fonts.bold },
  waterBtn: { width: 110, height: 160 },
  waterBtnPressed: { opacity: 0.85 },
  mock: { marginTop: 12, ...type.caption, color: colors.grey[300], textAlign: 'center' },
});
