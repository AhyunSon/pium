import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { Field, Input } from '../../src/components/Field';
import { Screen } from '../../src/components/Screen';
import { useOnboardingDraft } from '../../src/data/onboardingDraft';
import { colors } from '../../src/theme/colors';

const EXAMPLES = ['저녁 약 챙겨 먹기', '10분 스트레칭', '책 10쪽 읽기', '물 한 컵 마시기'];

export default function HabitScreen() {
  const router = useRouter();
  const { draft, setDraft } = useOnboardingDraft();
  const canNext = draft.habit.trim().length > 1;

  return (
    <Screen
      scroll
      title="목표 습관"
      hint="4일 동안 매일 지킬 행동 한 가지. 이 행동을 마친 뒤에만 물을 줍니다."
      footer={<Button label="다음" disabled={!canNext} onPress={() => router.push('/onboarding/permissions')} />}
    >
      <Field label="행동 (주관식)">
        <Input
          value={draft.habit}
          onChangeText={(habit) => setDraft({ habit })}
          placeholder="예: 저녁 약 챙겨 먹기"
          multiline
        />
      </Field>
      <Text style={styles.exLabel}>예시</Text>
      <View style={styles.examples}>
        {EXAMPLES.map((ex) => (
          <Text key={ex} style={styles.example} onPress={() => setDraft({ habit: ex })}>
            {ex}
          </Text>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  exLabel: { fontSize: 13, color: colors.textMuted, marginBottom: 8 },
  examples: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  example: {
    fontSize: 14,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.border,
  },
});
