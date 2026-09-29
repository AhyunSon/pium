import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import { Button } from '../../src/components/Button';
import { Chips } from '../../src/components/Chips';
import { Field, Input } from '../../src/components/Field';
import { Screen } from '../../src/components/Screen';
import { exportCsvAndShare } from '../../src/data/exportFile';
import { useStore } from '../../src/data/store';
import type { AgeGroup, Gender, Profile } from '../../src/data/types';
import { colors } from '../../src/theme/colors';

const GENDERS: readonly Gender[] = ['여성', '남성', '기타', '응답 안 함'];
const AGES: readonly AgeGroup[] = ['10대', '20대', '30대', '40대', '50대', '60대 이상'];

export default function SettingsScreen() {
  const { state, saveProfile } = useStore();
  const p = state.profile;
  const formKey = p ? `${p.name}|${p.gender}|${p.ageGroup}|${p.habit}` : 'none';

  return <SettingsForm key={formKey} profile={p} onSave={saveProfile} appState={state} />;
}

type FormProps = {
  profile: Profile | null;
  onSave: (input: Pick<Profile, 'name' | 'gender' | 'ageGroup' | 'habit'>) => void;
  appState: ReturnType<typeof useStore>['state'];
};

function SettingsForm({ profile: p, onSave, appState }: FormProps) {
  const router = useRouter();
  const [name, setName] = useState(p?.name ?? '');
  const [gender, setGender] = useState<Gender | null>(p?.gender ?? null);
  const [ageGroup, setAgeGroup] = useState<AgeGroup | null>(p?.ageGroup ?? null);
  const [habit, setHabit] = useState(p?.habit ?? '');
  const [exporting, setExporting] = useState(false);

  const dirty = p
    ? name.trim() !== p.name || gender !== p.gender || ageGroup !== p.ageGroup || habit.trim() !== p.habit
    : false;

  const exportData = async () => {
    setExporting(true);
    try {
      await exportCsvAndShare(appState);
    } catch (e) {
      Alert.alert('내보내기 실패', e instanceof Error ? e.message : '다시 시도해 주세요.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Screen
      scroll
      title="설정"
      hint="사용자 정보만 고칠 수 있습니다."
      footer={
        <Button
          label="저장"
          onPress={() => onSave({ name: name.trim(), gender, ageGroup, habit: habit.trim() })}
          disabled={!dirty || !name.trim() || !habit.trim()}
        />
      }
    >
      <Field label="이름 또는 별칭">
        <Input value={name} onChangeText={setName} />
      </Field>
      <Field label="성별">
        <Chips options={GENDERS} value={gender} onChange={setGender} />
      </Field>
      <Field label="연령대">
        <Chips options={AGES} value={ageGroup} onChange={setAgeGroup} />
      </Field>
      <Field label="목표 습관" helper="실험 중에 바꾸면 기록에 남습니다.">
        <Input value={habit} onChangeText={setHabit} multiline />
      </Field>

      <Field label="내 기록">
        <Button variant="secondary" label="기록 내보내기 (CSV)" onPress={exportData} loading={exporting} />
      </Field>

      <Pressable onLongPress={() => router.push('/sos')} delayLongPress={900} style={styles.hidden}>
        <Text style={styles.hiddenLabel}>피움 · {p?.participantId ?? ''}</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hidden: { marginTop: 24, alignSelf: 'center', padding: 12 },
  hiddenLabel: { fontSize: 12, color: colors.gray[100] },
});
