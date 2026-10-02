import { useRouter } from 'expo-router';
import { Button } from '../../src/components/Button';
import { Chips } from '../../src/components/Chips';
import { Field, Input } from '../../src/components/Field';
import { Screen } from '../../src/components/Screen';
import { useOnboardingDraft } from '../../src/data/onboardingDraft';
import type { AgeGroup, Gender } from '../../src/data/types';

const GENDERS: readonly Gender[] = ['여성', '남성', '기타', '응답 안 함'];
const AGES: readonly AgeGroup[] = ['10대', '20대', '30대', '40대', '50대', '60대 이상'];

export default function RegisterScreen() {
  const router = useRouter();
  const { draft, setDraft } = useOnboardingDraft();
  const canNext = draft.name.trim().length > 0 && draft.gender !== null && draft.ageGroup !== null;

  return (
    <Screen
      safeBottom
      scroll
      title="사용자 등록"
      hint="연구 기록을 구분하는 데만 쓰입니다."
      footer={<Button label="다음" disabled={!canNext} onPress={() => router.push('/onboarding/habit')} />}
    >
      <Field label="이름 또는 별칭">
        <Input
          value={draft.name}
          onChangeText={(name) => setDraft({ name })}
          placeholder="이름"
          autoCapitalize="none"
          returnKeyType="done"
        />
      </Field>
      <Field label="성별">
        <Chips options={GENDERS} value={draft.gender} onChange={(gender) => setDraft({ gender })} />
      </Field>
      <Field label="연령대">
        <Chips options={AGES} value={draft.ageGroup} onChange={(ageGroup) => setDraft({ ageGroup })} />
      </Field>
    </Screen>
  );
}
