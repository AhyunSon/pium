import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { Dropdown, Field, Input } from '../../src/components/Field';
import { Screen } from '../../src/components/Screen';
import { Title } from '../../src/components/Title';
import { useOnboardingDraft } from '../../src/data/onboardingDraft';
import { AGE_GROUPS } from '../../src/data/types';
import { colors } from '../../src/theme/colors';

/** 피그마 Onboarding_User: 이름 · 연령대 · 목표습관 · FIUM 기기 번호 한 장 폼 */
export default function OnboardingUserScreen() {
  const router = useRouter();
  const { draft, setDraft } = useOnboardingDraft();
  const canNext =
    draft.name.trim().length > 0 &&
    draft.ageGroup !== null &&
    draft.habit.trim().length > 0 &&
    /^\d+$/.test(draft.deviceNumber.trim());

  return (
    <Screen
      safeBottom
      scroll
      bg={colors.grey.white}
      footer={<Button label="다음" disabled={!canNext} onPress={() => router.push('/onboarding/permissions')} />}
    >
      <Title title={'반가워요!\n먼저 당신에 대해 알려주세요.'} />
      <View style={styles.form}>
        <Field label="이름">
          <Input
            value={draft.name}
            onChangeText={(name) => setDraft({ name })}
            placeholder="이름을 입력해주세요"
            autoCapitalize="none"
            returnKeyType="next"
          />
        </Field>
        <Field label="연령대">
          <Dropdown
            value={draft.ageGroup}
            options={AGE_GROUPS}
            placeholder="연령대를 선택해주세요"
            onChange={(ageGroup) => setDraft({ ageGroup })}
          />
        </Field>
        <Field label="목표습관">
          <Input
            value={draft.habit}
            onChangeText={(habit) => setDraft({ habit })}
            placeholder="목표 습관을 구체적으로 입력해주세요!"
            returnKeyType="next"
          />
        </Field>
        <Field label="FIUM 기기 번호">
          <Input
            value={draft.deviceNumber}
            onChangeText={(deviceNumber) => setDraft({ deviceNumber: deviceNumber.replace(/[^\d]/g, '') })}
            placeholder="기기 번호를 입력해주세요"
            keyboardType="number-pad"
            maxLength={3}
            returnKeyType="done"
          />
        </Field>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { paddingTop: 20, paddingBottom: 36, gap: 32 },
});
