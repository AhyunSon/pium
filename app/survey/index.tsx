import { useRouter } from 'expo-router';
import { Image, StyleSheet, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { Screen } from '../../src/components/Screen';
import { Title } from '../../src/components/Title';
import { useSurveyDraft } from '../../src/data/surveyDraft';
import { colors } from '../../src/theme/colors';

export default function GoDiaryScreen() {
  const router = useRouter();
  const { date, mode } = useSurveyDraft();

  return (
    <Screen
      safeBottom
      nav={{ left: 'close', onLeft: () => router.back() }}
      footer={
        <Button
          label="시작하기"
          onPress={() =>
            router.push({ pathname: '/survey/1', params: { date, mode } })
          }
        />
      }
      contentStyle={styles.content}
    >
      <Image source={require('../../assets/images/bg-godiary.png')} style={styles.bg} resizeMode="contain" />
      <Title
        align="center"
        title="오늘의 FIUM은 어땠나요?"
        subtitle={'8개의 질문으로\n오늘의 경험을 돌아봐요.'}
        subtitleColor={colors.grey[500]}
      />
      <View />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, alignItems: 'center', justifyContent: 'space-between' },
  bg: {
    position: 'absolute',
    left: -20,
    right: -20,
    top: 40,
    bottom: 80,
    width: undefined,
    height: undefined,
  },
});
