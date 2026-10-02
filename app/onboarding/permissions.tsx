import { DeviceMotion } from 'expo-sensors';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFlower } from '../../src/ble/FlowerProvider';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { Screen } from '../../src/components/Screen';
import { useOnboardingDraft } from '../../src/data/onboardingDraft';
import { useStore } from '../../src/data/store';
import { colors } from '../../src/theme/colors';

type Status = 'idle' | 'ok' | 'denied' | 'skip';

export default function PermissionsScreen() {
  const router = useRouter();
  const { draft } = useOnboardingDraft();
  const { saveProfile } = useStore();
  const flower = useFlower();
  const [motion, setMotion] = useState<Status>('idle');
  const [ble, setBle] = useState<Status>('idle');
  const [busy, setBusy] = useState(false);

  const askMotion = async () => {
    try {
      const available = await DeviceMotion.isAvailableAsync();
      if (!available) {
        setMotion('skip');
        return;
      }
      const res = await DeviceMotion.requestPermissionsAsync();
      setMotion(res.granted ? 'ok' : 'denied');
    } catch {
      setMotion('skip');
    }
  };

  const askBle = async () => {
    setBusy(true);
    try {
      await flower.connect();
      setBle(flower.kind === 'mock' ? 'skip' : 'ok');
    } catch {
      setBle('denied');
    } finally {
      setBusy(false);
    }
  };

  const finish = () => {
    saveProfile({
      name: draft.name.trim(),
      gender: draft.gender,
      ageGroup: draft.ageGroup,
      habit: draft.habit.trim(),
    });
    router.replace('/home');
  };

  return (
    <Screen
      safeBottom
      scroll
      title="권한"
      hint="알림은 쓰지 않습니다. 아래 두 가지만 필요합니다."
      footer={<Button label="홈으로" onPress={finish} />}
    >
      <Card kicker="동작 센서">
        <Text style={styles.body}>폰을 기울여 물을 붓는 동작을 읽습니다.</Text>
        <View style={styles.row}>
          <Text style={styles.status}>{label(motion)}</Text>
          <Button small variant="secondary" label={motion === 'ok' ? '확인됨' : '허용'} onPress={askMotion} disabled={motion === 'ok'} />
        </View>
      </Card>
      <Card kicker="블루투스">
        <Text style={styles.body}>화분 로봇과 연결합니다. 지금 연결되지 않아도 홈에서 다시 할 수 있습니다.</Text>
        <View style={styles.row}>
          <Text style={styles.status}>{ble === 'skip' ? '개발 빌드에서 실제 연결' : label(ble)}</Text>
          <Button
            small
            variant="secondary"
            label={flower.connection === 'connected' ? '연결됨' : '연결'}
            onPress={askBle}
            loading={busy}
            disabled={flower.connection === 'connected'}
          />
        </View>
      </Card>
    </Screen>
  );
}

function label(s: Status): string {
  switch (s) {
    case 'ok':
      return '허용됨';
    case 'denied':
      return '거부됨 · 설정에서 켤 수 있음';
    case 'skip':
      return '이 기기에서는 필요 없음';
    default:
      return '아직 묻지 않음';
  }
}

const styles = StyleSheet.create({
  body: { fontSize: 15, color: colors.text, lineHeight: 22 },
  row: { marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  status: { fontSize: 13, color: colors.textMuted, flex: 1, marginRight: 12 },
});
