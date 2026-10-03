import { Stack, useLocalSearchParams } from 'expo-router';
import { SurveyDraftProvider, SurveyMode } from '../../src/data/surveyDraft';
import { useStore } from '../../src/data/store';
import { toDateKey } from '../../src/data/time';
import { EMPTY_SURVEY } from '../../src/data/types';
import { colors } from '../../src/theme/colors';

export default function SurveyLayout() {
  const params = useLocalSearchParams<{ date?: string; mode?: string }>();
  const { state } = useStore();
  const date = typeof params.date === 'string' && params.date.length >= 8 ? params.date : toDateKey();
  const existing = state.diary.find((d) => d.date === date);
  const mode = (params.mode === 'review' || params.mode === 'edit' ? params.mode : existing ? 'review' : 'write') as SurveyMode;

  return (
    <SurveyDraftProvider
      date={date}
      initialMode={mode}
      initial={
        existing
          ? {
              q1_noticedPetal: existing.q1_noticedPetal,
              q2_recalledHabit: existing.q2_recalledHabit,
              q3_petalStateWhenRecalled: existing.q3_petalStateWhenRecalled,
              q4_didHabit: existing.q4_didHabit,
              q5_influences: existing.q5_influences,
              q5_reasons: existing.q5_reasons,
              q5_otherText: existing.q5_otherText,
              q6_startDelay: existing.q6_startDelay,
              q7_waterDelay: existing.q7_waterDelay,
              q8_freeText: existing.q8_freeText,
            }
          : EMPTY_SURVEY
      }
    >
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_right',
        }}
      />
    </SurveyDraftProvider>
  );
}
