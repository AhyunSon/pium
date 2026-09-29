import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { Screen } from '../../src/components/Screen';
import { useStore } from '../../src/data/store';
import { addDays, formatKoreanDate, parseDateKey, studyDay, toDateKey } from '../../src/data/time';
import { colors } from '../../src/theme/colors';

const WEEK = ['일', '월', '화', '수', '목', '금', '토'];

export default function CalendarScreen() {
  const { state } = useStore();
  const today = toDateKey();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [selected, setSelected] = useState<string>(today);

  const studyDays = useMemo(() => {
    if (!state.profile) return new Set<string>();
    const s = new Set<string>();
    for (let i = 0; i < 4; i++) s.add(addDays(state.profile.studyStartDate, i));
    return s;
  }, [state.profile]);

  const byDate = useMemo(() => {
    const map = new Map<string, { water: number; diary: boolean; did: boolean | null }>();
    for (const w of state.waterEvents) {
      const cur = map.get(w.date) ?? { water: 0, diary: false, did: null };
      cur.water += 1;
      map.set(w.date, cur);
    }
    for (const d of state.diary) {
      const cur = map.get(d.date) ?? { water: 0, diary: false, did: null };
      cur.diary = true;
      cur.did = d.didHabit;
      map.set(d.date, cur);
    }
    return map;
  }, [state.waterEvents, state.diary]);

  const cells = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const lead = first.getDay();
    const days = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const out: (string | null)[] = Array(lead).fill(null);
    for (let d = 1; d <= days; d++) out.push(toDateKey(new Date(cursor.y, cursor.m, d)));
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [cursor]);

  const move = (delta: number) => {
    const d = new Date(cursor.y, cursor.m + delta, 1);
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
  };

  const sel = byDate.get(selected);
  const selDiary = state.diary.find((d) => d.date === selected);
  const selWater = state.waterEvents.filter((w) => w.date === selected);
  const selDay = state.profile ? studyDay(state.profile.studyStartDate, selected) : null;

  return (
    <Screen scroll title="월간" hint="노란 칸이 실험 4일입니다.">
      <View style={styles.monthRow}>
        <Button small variant="ghost" label="‹" onPress={() => move(-1)} />
        <Text style={styles.month}>
          {cursor.y}년 {cursor.m + 1}월
        </Text>
        <Button small variant="ghost" label="›" onPress={() => move(1)} />
      </View>

      <View style={styles.week}>
        {WEEK.map((w) => (
          <Text key={w} style={styles.weekLabel}>
            {w}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((key, i) => {
          if (!key) return <View key={`e${i}`} style={styles.cell} />;
          const info = byDate.get(key);
          const isStudy = studyDays.has(key);
          const isToday = key === today;
          const isSel = key === selected;
          return (
            <Pressable key={key} style={styles.cell} onPress={() => setSelected(key)}>
              <View style={[styles.day, isStudy && styles.dayStudy, isSel && styles.daySel]}>
                <Text style={[styles.dayText, isToday && styles.dayToday, isSel && styles.dayTextSel]}>
                  {parseDateKey(key).getDate()}
                </Text>
                <View style={styles.marks}>
                  {info?.water ? <View style={[styles.mark, styles.markWater]} /> : null}
                  {info?.diary ? (
                    <View style={[styles.mark, info.did ? styles.markDid : styles.markMissed]} />
                  ) : null}
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.legend}>
        <Legend color={colors.blue[300]} label="물주기" />
        <Legend color={colors.yellow[400]} label="행동함" />
        <Legend color={colors.gray[200]} label="못 함" />
      </View>

      <Card kicker={`${formatKoreanDate(selected)}${selDay ? ` · ${selDay}일차` : ''}`}>
        {!sel ? (
          <Text style={styles.empty}>기록이 없습니다</Text>
        ) : (
          <>
            {selWater.length > 0 ? (
              <Text style={styles.line}>
                물주기 {selWater.length}회 ·{' '}
                {selWater.map((w) => w.at.slice(11, 16)).join(', ')}
              </Text>
            ) : (
              <Text style={styles.line}>물주기 없음</Text>
            )}
            {selDiary ? (
              <>
                <Text style={styles.line}>
                  행동 {selDiary.didHabit === null ? '미응답' : selDiary.didHabit ? '했다' : '못 했다'}
                  {selDiary.startTime ? ` · ${selDiary.startTime} 시작` : ''}
                </Text>
                {selDiary.trigger ? (
                  <Text style={styles.line}>
                    계기 {selDiary.trigger}
                    {selDiary.triggerNote ? ` (${selDiary.triggerNote})` : ''}
                  </Text>
                ) : null}
                {selDiary.wiltAtWater !== null ? (
                  <Text style={styles.line}>물 줄 때 꽃 {selDiary.wiltAtWater}% 시듦</Text>
                ) : null}
                {selDiary.note ? <Text style={styles.note}>{selDiary.note}</Text> : null}
              </>
            ) : (
              <Text style={styles.line}>일일 기록 없음</Text>
            )}
          </>
        )}
      </Card>
    </Screen>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.mark, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  month: { fontSize: 17, fontWeight: '600', color: colors.text },
  week: { flexDirection: 'row', marginBottom: 6 },
  weekLabel: { flex: 1, textAlign: 'center', fontSize: 12, color: colors.textMuted },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, padding: 3 },
  day: {
    aspectRatio: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.gray[50],
  },
  dayStudy: { backgroundColor: colors.yellow[50], borderColor: colors.yellow[200] },
  daySel: { borderColor: colors.yellow[500], borderWidth: 1.5 },
  dayText: { fontSize: 14, color: colors.text },
  dayToday: { fontWeight: '700' },
  dayTextSel: { color: colors.yellow[700] },
  marks: { flexDirection: 'row', gap: 3, marginTop: 4, height: 6 },
  mark: { width: 6, height: 6, borderRadius: 3 },
  markWater: { backgroundColor: colors.blue[300] },
  markDid: { backgroundColor: colors.yellow[400] },
  markMissed: { backgroundColor: colors.gray[200] },
  legend: { flexDirection: 'row', gap: 16, marginTop: 12, marginBottom: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendText: { fontSize: 12, color: colors.textMuted },
  empty: { fontSize: 14, color: colors.textMuted },
  line: { fontSize: 14, color: colors.text, lineHeight: 22 },
  note: { fontSize: 13, color: colors.textMuted, marginTop: 6, lineHeight: 20 },
});
