import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { Chips } from '../../src/components/Chips';
import { Field, Input } from '../../src/components/Field';
import { Screen } from '../../src/components/Screen';
import { Slider } from '../../src/components/Slider';
import { useStore } from '../../src/data/store';
import { formatKoreanDate, toDateKey, toTimeKey } from '../../src/data/time';
import type { DiaryEntry, Trigger, WaterEvent } from '../../src/data/types';
import { colors } from '../../src/theme/colors';

const TRIGGERS: readonly Trigger[] = ['스스로 기억', '화분을 보고', '정해진 시간', '다른 사람', '기타'];
const DID_OPTIONS = ['했다', '못 했다'] as const;
type Did = (typeof DID_OPTIONS)[number];

export default function DiaryScreen() {
  const { state, todayDiary, todayWater, saveDiary } = useStore();
  const today = toDateKey();

  const lastWater = useMemo(
    () => [...todayWater].sort((a, b) => b.at.localeCompare(a.at))[0] ?? null,
    [todayWater],
  );
  const autoWilt = lastWater?.wiltPercent ?? null;

  // 저장된 기록이 바뀌면 폼을 새로 그립니다 (key로 remount)
  const formKey = `${todayDiary?.updatedAt ?? 'new'}-${autoWilt ?? 'x'}`;

  return (
    <DiaryForm
      key={formKey}
      today={today}
      habit={state.profile?.habit ?? ''}
      entry={todayDiary}
      water={todayWater}
      autoWilt={autoWilt}
      onSave={saveDiary}
    />
  );
}

type FormProps = {
  today: string;
  habit: string;
  entry: DiaryEntry | null;
  water: WaterEvent[];
  autoWilt: number | null;
  onSave: (entry: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>) => DiaryEntry;
};

function DiaryForm({ today, habit, entry, water, autoWilt, onSave }: FormProps) {
  const [did, setDid] = useState<Did | null>(
    entry?.didHabit === null || entry?.didHabit === undefined ? null : entry.didHabit ? '했다' : '못 했다',
  );
  const [startTime, setStartTime] = useState(entry?.startTime ?? '');
  const [trigger, setTrigger] = useState<Trigger | null>(entry?.trigger ?? null);
  const [triggerNote, setTriggerNote] = useState(entry?.triggerNote ?? '');
  const [wilt, setWilt] = useState<number>(entry?.wiltAtWater ?? autoWilt ?? 50);
  const [note, setNote] = useState(entry?.note ?? '');
  const [savedAt, setSavedAt] = useState<string | null>(entry?.updatedAt ?? null);

  const save = () => {
    const saved = onSave({
      date: today,
      didHabit: did === null ? null : did === '했다',
      startTime: startTime.trim() || null,
      trigger,
      triggerNote: triggerNote.trim(),
      wiltAtWater: did === '했다' ? wilt : null,
      note: note.trim(),
    });
    setSavedAt(saved.updatedAt);
  };

  return (
    <Screen
      scroll
      title="오늘"
      hint={`${formatKoreanDate(today)} · ${habit}`}
      footer={<Button label={entry ? '수정 저장' : '저장'} onPress={save} disabled={did === null} />}
    >
      {water.length > 0 ? (
        <Card kicker="오늘 물주기" tone="soft">
          {water.map((w) => (
            <Text key={w.id} style={styles.waterLine}>
              {w.at.slice(11, 16)} · {w.wiltPercent !== null ? `꽃 ${w.wiltPercent}% 시듦` : '꽃 상태 기록 없음'}
              {w.deviceConnected ? '' : ' · 미연결'}
            </Text>
          ))}
        </Card>
      ) : null}

      <Field label="목표 행동을 했나요?">
        <Chips options={DID_OPTIONS} value={did} onChange={setDid} />
      </Field>

      {did === '했다' ? (
        <>
          <Field label="시작한 시각" helper="대략이어도 괜찮습니다">
            <View style={styles.timeRow}>
              <Input
                value={startTime}
                onChangeText={setStartTime}
                placeholder="예: 21:30"
                keyboardType="numbers-and-punctuation"
                style={styles.timeInput}
                maxLength={5}
              />
              <Button small variant="secondary" label="지금" onPress={() => setStartTime(toTimeKey())} />
            </View>
          </Field>

          <Field label="무엇이 시작하게 했나요?">
            <Chips options={TRIGGERS} value={trigger} onChange={setTrigger} />
            {trigger === '기타' || trigger === '다른 사람' ? (
              <Input
                value={triggerNote}
                onChangeText={setTriggerNote}
                placeholder="조금 더 적어 주세요"
                style={styles.noteInput}
              />
            ) : null}
          </Field>

          <Field
            label="물을 줄 때 꽃은 얼마나 시들어 있었나요?"
            helper={
              autoWilt !== null
                ? `화분이 보낸 값 ${autoWilt}% 를 기준으로 채웠습니다. 눈으로 본 느낌으로 고쳐도 됩니다.`
                : '눈으로 본 느낌대로'
            }
          >
            <Slider value={wilt} onChange={setWilt} leftLabel="활짝 핌" rightLabel="완전히 시듦" />
          </Field>

          <Field label="메모">
            <Input value={note} onChangeText={setNote} placeholder="선택" multiline />
          </Field>
        </>
      ) : null}

      {did === '못 했다' ? (
        <Field label="이유가 있다면">
          <Input value={note} onChangeText={setNote} placeholder="선택" multiline />
        </Field>
      ) : null}

      {savedAt ? <Text style={styles.saved}>저장됨 · {savedAt.slice(11, 16)}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  waterLine: { fontSize: 14, color: colors.yellow[700], lineHeight: 22 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  timeInput: { flex: 1 },
  noteInput: { marginTop: 10 },
  saved: { fontSize: 12, color: colors.gray[300], textAlign: 'center', marginTop: 4 },
});
