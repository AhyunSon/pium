import { StyleSheet, Text, View } from 'react-native';
import { connectionGuide, connectionLabel } from '../../src/ble/connectionText';
import { useFlower } from '../../src/ble/FlowerProvider';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { Screen } from '../../src/components/Screen';
import { useStore } from '../../src/data/store';
import { formatKoreanDate, studyDay, toDateKey } from '../../src/data/time';
import { colors } from '../../src/theme/colors';

export default function HomeScreen() {
  const { state, todayWater, todayDiary } = useStore();
  const flower = useFlower();
  const today = toDateKey();
  const day = state.profile ? studyDay(state.profile.studyStartDate, today) : null;
  const connected = flower.connection === 'connected';
  const busy = flower.connection === 'scanning' || flower.connection === 'connecting';
  const guide = connectionGuide(flower.connection, flower.stale);

  return (
    <Screen
      title={state.profile ? `${state.profile.name} 님` : '홈'}
      hint={`${formatKoreanDate(today)}${day ? ` · ${day}일차` : ''}`}
    >
      <Card kicker="오늘의 행동" tone="soft">
        <Text style={styles.habit}>{state.profile?.habit ?? '목표 습관이 없습니다'}</Text>
        <Text style={styles.sub}>
          {todayWater.length > 0
            ? `오늘 ${todayWater.length}번 물을 주었습니다`
            : '행동을 마치면 물주기 탭에서 물을 주세요'}
        </Text>
      </Card>

      <Card kicker="화분">
        <View style={styles.row}>
          <View style={[styles.dot, connected && !flower.stale && styles.dotOn, busy && styles.dotBusy]} />
          <Text style={styles.status}>{connectionLabel(flower.connection, flower.stale)}</Text>
        </View>
        {connected && flower.wiltPercent !== null ? (
          <Text style={styles.sub}>꽃 상태 {100 - flower.wiltPercent}% 피어 있음</Text>
        ) : null}
        {guide.length > 0 ? (
          <View style={styles.guide}>
            {guide.map((g) => (
              <Text key={g} style={styles.guideLine}>
                · {g}
              </Text>
            ))}
          </View>
        ) : null}
        {flower.lastError && !connected ? <Text style={styles.err}>{flower.lastError}</Text> : null}
        <View style={styles.actions}>
          {connected ? (
            <Button small variant="ghost" label="연결 끊기" onPress={flower.disconnect} />
          ) : (
            <Button small variant="secondary" label={busy ? '찾는 중' : '연결'} loading={busy} onPress={flower.connect} />
          )}
        </View>
        {flower.kind === 'mock' ? <Text style={styles.mock}>Expo Go: 가상 화분으로 동작 중</Text> : null}
      </Card>

      {!todayDiary ? (
        <Text style={styles.footnote}>오늘 기록은 아직 없습니다. 하루가 끝나기 전에 오늘 탭에서 남겨 주세요.</Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  habit: { fontSize: 20, fontWeight: '600', color: colors.yellow[700], lineHeight: 28 },
  sub: { marginTop: 8, fontSize: 13, color: colors.textMuted },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.gray[200] },
  dotOn: { backgroundColor: colors.blue[300] },
  dotBusy: { backgroundColor: colors.yellow[300] },
  status: { fontSize: 17, color: colors.text },
  guide: { marginTop: 12, gap: 4 },
  guideLine: { fontSize: 13, color: colors.textMuted, lineHeight: 20 },
  err: { marginTop: 8, fontSize: 12, color: colors.gray[300] },
  actions: { marginTop: 14, flexDirection: 'row' },
  mock: { marginTop: 10, fontSize: 11, color: colors.gray[300] },
  footnote: { marginTop: 8, fontSize: 13, color: colors.gray[300], lineHeight: 20 },
});
