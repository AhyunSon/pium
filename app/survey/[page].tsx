import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { Chip } from '../../src/components/Chip';
import { Input } from '../../src/components/Field';
import { Screen } from '../../src/components/Screen';
import {
  CheckGroup,
  PetalScalePicker,
  SurveyProgress,
  SurveyQuestion,
  YesNoRow,
} from '../../src/components/SurveyWidgets';
import { useStore } from '../../src/data/store';
import { useSurveyDraft } from '../../src/data/surveyDraft';
import {
  DELAY_LABELS,
  Delay,
  INFLUENCE_LABELS,
  Influence,
  REASON_LABELS,
  Reason,
} from '../../src/data/types';
import { colors } from '../../src/theme/colors';

const INFLUENCES = (Object.keys(INFLUENCE_LABELS) as Influence[]).map((key) => ({
  key,
  label: INFLUENCE_LABELS[key],
}));
const REASONS = (Object.keys(REASON_LABELS) as Reason[]).map((key) => ({ key, label: REASON_LABELS[key] }));
const DELAYS = (Object.keys(DELAY_LABELS) as Delay[]).map((key) => ({ key, label: DELAY_LABELS[key] }));

export default function SurveyPage() {
  const router = useRouter();
  const { page } = useLocalSearchParams<{ page: string }>();
  const step = page === '2' ? 2 : page === '3' ? 3 : 1;
  const { date, mode, answers, setMode } = useSurveyDraft();
  const { saveDiary } = useStore();
  const locked = mode === 'review';

  const go = (next: 1 | 2 | 3) => {
    router.push({ pathname: `/survey/${next}`, params: { date, mode } });
  };

  const canNext1 = answers.q1_noticedPetal && answers.q2_recalledHabit && answers.q3_petalStateWhenRecalled;
  const canNext2 =
    answers.q4_didHabit &&
    (answers.q4_didHabit === 'yes'
      ? answers.q5_influences.length > 0 && answers.q6_startDelay && answers.q7_waterDelay
      : answers.q5_reasons.length > 0);
  const nextVariant = locked ? 'largeMuted' : 'large';
  const prevVariant = locked ? 'outlineMuted' : 'outline';

  const footer =
    step === 1 ? (
      <Button
        label="다음"
        variant={nextVariant}
        disabled={!locked && !canNext1}
        onPress={() => go(2)}
      />
    ) : step === 2 ? (
      <View style={styles.row}>
        <Button variant={prevVariant} label="이전" onPress={() => router.back()} style={styles.half} />
        <Button variant={nextVariant} label="다음" disabled={!locked && !canNext2} onPress={() => go(3)} style={styles.half} />
      </View>
    ) : mode === 'write' ? (
      <View style={styles.row}>
        <Button variant={prevVariant} label="이전" onPress={() => router.back()} style={styles.half} />
        <Button
          label="저장하기"
          variant={nextVariant}
          onPress={() => {
            saveDiary(date, answers);
            router.replace('/diary');
          }}
          style={styles.half}
        />
      </View>
    ) : (
      <Button variant={prevVariant} label="이전" onPress={() => router.back()} />
    );

  const right =
    mode === 'review' ? (
      <Button variant="smallMid" label="수정" onPress={() => setMode('edit')} />
    ) : mode === 'edit' ? (
      <View style={styles.editRight}>
        <Chip label="수정 중" tone="text" />
        <Button
          variant="smallDark"
          label="저장"
          onPress={() => {
            saveDiary(date, answers);
            if (step === 3) {
              router.replace('/diary');
            } else {
              setMode('review');
            }
          }}
        />
      </View>
    ) : undefined;

  const firstWrite = mode === 'write';
  const insets = useSafeAreaInsets();

  return (
    <Screen
      safeBottom={!firstWrite}
      scroll
      nav={{
        left: 'back',
        onLeft: () => router.back(),
        center: `0${step} / 03`,
        right,
      }}
      footer={firstWrite ? undefined : footer}
    >
      <SurveyProgress current={step} />
      <View style={styles.body}>
        {step === 1 ? <Page1 locked={locked} /> : null}
        {step === 2 ? <Page2 locked={locked} /> : null}
        {step === 3 ? <Page3 locked={locked} /> : null}
      </View>
      {firstWrite ? (
        <View style={[styles.inlineFooter, { paddingBottom: insets.bottom }]}>{footer}</View>
      ) : null}
    </Screen>
  );
}

function Page1({ locked }: { locked: boolean }) {
  const { answers, setAnswers } = useSurveyDraft();
  return (
    <>
      <View style={styles.block}>
        <SurveyQuestion number="Q1.">오늘 FIUM의 꽃잎 상태 변화를 알아차린 적이 있었나요?</SurveyQuestion>
        <YesNoRow value={answers.q1_noticedPetal} disabled={locked} onChange={(v) => setAnswers({ q1_noticedPetal: v })} />
      </View>
      <View style={styles.block}>
        <SurveyQuestion number="Q2">
          FIUM을 보면서 오늘 <Text style={styles.em}>설정한 목표 행동</Text>이 <Text style={styles.em}>떠오른 적</Text>이
          있었나요?
        </SurveyQuestion>
        <YesNoRow value={answers.q2_recalledHabit} disabled={locked} onChange={(v) => setAnswers({ q2_recalledHabit: v })} />
      </View>
      <View style={styles.block}>
        <SurveyQuestion number="Q3.">
          목표 행동이 떠올랐을 때 Fium의 꽃잎은 <Text style={styles.em}>어떤 상태</Text>였나요?
        </SurveyQuestion>
        <PetalScalePicker
          value={answers.q3_petalStateWhenRecalled}
          disabled={locked}
          onChange={(v) => setAnswers({ q3_petalStateWhenRecalled: v })}
        />
      </View>
    </>
  );
}

function Page2({ locked }: { locked: boolean }) {
  const { answers, setAnswers } = useSurveyDraft();
  const yes = answers.q4_didHabit === 'yes';
  const no = answers.q4_didHabit === 'no';

  return (
    <>
      <View style={styles.block}>
        <SurveyQuestion number="Q4.">오늘 목표 행동을 수행했나요?</SurveyQuestion>
        <YesNoRow
          value={answers.q4_didHabit}
          disabled={locked}
          onChange={(v) =>
            setAnswers({
              q4_didHabit: v,
              q5_influences: [],
              q5_reasons: [],
              q6_startDelay: null,
              q6_laterReason: '',
              q7_waterDelay: null,
              q7_laterReason: '',
            })
          }
        />
      </View>
      {yes ? (
        <>
          <View style={styles.block}>
            <SurveyQuestion number="Q5.">
              {`오늘 목표 행동을 시작하게 된 데\n영향을 준 것은 무엇이었나요?`}
            </SurveyQuestion>
            <CheckGroup
              options={INFLUENCES}
              value={answers.q5_influences.slice(0, 1)}
              disabled={locked}
              otherText={answers.q5_otherText}
              onOtherText={(q5_otherText) => setAnswers({ q5_otherText })}
              onChange={(q5_influences) => setAnswers({ q5_influences })}
            />
          </View>
          <View style={styles.block}>
            <SurveyQuestion number="Q6.">
              {`목표 행동이 떠오른 후, 실제로 행동을\n시작하기까지 어느 정도 시간이 걸렸나요?`}
            </SurveyQuestion>
            <CheckGroup
              options={DELAYS}
              value={answers.q6_startDelay ? [answers.q6_startDelay] : []}
              disabled={locked}
              textKey="later"
              textPlaceholder="이유를 입력해주세요."
              otherText={answers.q6_laterReason}
              onOtherText={(q6_laterReason) => setAnswers({ q6_laterReason })}
              onChange={(v) =>
                setAnswers({
                  q6_startDelay: (v[0] as Delay | undefined) ?? null,
                  q6_laterReason: v[0] === 'later' ? answers.q6_laterReason : '',
                })
              }
            />
          </View>
          <View style={styles.block}>
            <SurveyQuestion number="Q7.">
              목표 행동을 완료한 후 FIUM에 물을 주기까지 어느 정도 시간이 걸렸나요?
            </SurveyQuestion>
            <CheckGroup
              options={DELAYS}
              value={answers.q7_waterDelay ? [answers.q7_waterDelay] : []}
              disabled={locked}
              textKey="later"
              textPlaceholder="이유를 입력해주세요."
              otherText={answers.q7_laterReason}
              onOtherText={(q7_laterReason) => setAnswers({ q7_laterReason })}
              onChange={(v) =>
                setAnswers({
                  q7_waterDelay: (v[0] as Delay | undefined) ?? null,
                  q7_laterReason: v[0] === 'later' ? answers.q7_laterReason : '',
                })
              }
            />
          </View>
        </>
      ) : null}
      {no ? (
        <View style={styles.block}>
          <SurveyQuestion number="Q5.">
            {`오늘 목표 행동을 수행하지 않은\n가장 주된 이유는 무엇인가요?`}
          </SurveyQuestion>
          <CheckGroup
            options={REASONS}
            value={answers.q5_reasons}
            disabled={locked}
            otherText={answers.q5_otherText}
            onOtherText={(q5_otherText) => setAnswers({ q5_otherText })}
            onChange={(q5_reasons) => setAnswers({ q5_reasons })}
          />
        </View>
      ) : null}
    </>
  );
}

function Page3({ locked }: { locked: boolean }) {
  const { answers, setAnswers } = useSurveyDraft();
  return (
    <View style={styles.block}>
      <SurveyQuestion number="Q8.">
        오늘 FIUM을 사용하면서 어떤 생각이나 느낌이 들었나요?{'\n'}특히 기억에 남는 순간이 있다면 자유롭게 적어주세요.
      </SurveyQuestion>
      <Input
        multiline
        value={answers.q8_freeText}
        onChangeText={(q8_freeText) => setAnswers({ q8_freeText })}
        placeholder="자유롭게 작성해주세요."
        editable={!locked}
        style={styles.free}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingTop: 24, gap: 56 },
  block: { gap: 20, width: '100%' },
  em: { fontFamily: 'Pretendard-SemiBold' },
  row: { flexDirection: 'row', gap: 12, width: '100%' },
  half: { flex: 1, width: 0 },
  editRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inlineFooter: { paddingTop: 40, width: '100%' },
  free: { minHeight: 302, backgroundColor: colors.grey.white, borderWidth: 0 },
});
