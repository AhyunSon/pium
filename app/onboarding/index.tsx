import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { Screen } from '../../src/components/Screen';
import { colors } from '../../src/theme/colors';

export default function OnboardingStart() {
  const router = useRouter();

  return (
    <Screen safeBottom footer={<Button label="시작하기" onPress={() => router.push('/onboarding/register')} />}>
      <View style={styles.hero}>
        <Text style={styles.mark}>피움</Text>
        <Text style={styles.lead}>
          목표한 행동을 마치면{'\n'}화분에 물을 주세요.{'\n'}꽃이 피고, 하루에 걸쳐 천천히 시듭니다.
        </Text>
      </View>
      <View style={styles.steps}>
        <Step n="1" title="사용자 등록" body="이름, 성별, 연령대" />
        <Step n="2" title="목표 습관" body="4일 동안 지킬 행동 한 가지" />
        <Step n="3" title="권한" body="블루투스, 동작 센서" />
      </View>
    </Screen>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <View style={styles.step}>
      <Text style={styles.stepN}>{n}</Text>
      <View>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepBody}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { flex: 1, justifyContent: 'center', paddingBottom: 24 },
  mark: { fontSize: 32, fontWeight: '600', color: colors.yellow[600], letterSpacing: 3, marginBottom: 20 },
  lead: { fontSize: 18, lineHeight: 28, color: colors.text },
  steps: { gap: 14, paddingBottom: 12 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepN: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.yellow[50],
    color: colors.yellow[600],
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '600',
  },
  stepTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  stepBody: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
});
