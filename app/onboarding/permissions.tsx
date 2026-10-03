import { DeviceMotion } from 'expo-sensors';
import { useRouter } from 'expo-router';
import { ReactNode, useState } from 'react';
import { PermissionsAndroid, Platform, StyleSheet, Text, View } from 'react-native';
import { requestBluetoothPermissions } from '../../src/ble/FlowerClient';
import { useFlower } from '../../src/ble/FlowerProvider';
import { Button } from '../../src/components/Button';
import { Screen } from '../../src/components/Screen';
import { Title } from '../../src/components/Title';
import { useOnboardingDraft } from '../../src/data/onboardingDraft';
import { useStore } from '../../src/data/store';
import { colors } from '../../src/theme/colors';
import { PermActivityIcon, PermBluetoothIcon, PermStorageIcon } from '../../src/theme/icons';
import { type } from '../../src/theme/typography';

/** 피그마 Permission: 블루투스 · 신체 활동 · 저장소 안내 후 「설정하기」 */
export default function PermissionsScreen() {
  const router = useRouter();
  const { draft } = useOnboardingDraft();
  const { saveProfile } = useStore();
  const flower = useFlower();
  const [busy, setBusy] = useState(false);

  const askAll = async () => {
    setBusy(true);
    try {
      // 거부해도 막지 않는다. 홈/물주기에서 필요할 때 다시 묻는다.
      await requestBluetoothPermissions().catch(() => false);
      await flower.warmUp().catch(() => {});
      if (Platform.OS === 'android' && Number(Platform.Version) >= 29) {
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION).catch(() => null);
      }
      const motionOk = await DeviceMotion.isAvailableAsync().catch(() => false);
      if (motionOk) await DeviceMotion.requestPermissionsAsync().catch(() => null);
      // 저장소: 앱 전용 폴더에 쓰므로 별도 권한이 필요 없다. 안내만 한다.
    } finally {
      setBusy(false);
    }
    saveProfile({
      name: draft.name.trim(),
      ageGroup: draft.ageGroup,
      habit: draft.habit.trim(),
      deviceNumber: draft.deviceNumber.trim(),
    });
    router.replace('/home');
  };

  return (
    <Screen
      safeBottom
      nav={{ left: 'back', onLeft: () => router.back() }}
      footer={<Button label="설정하기" onPress={askAll} loading={busy} />}
    >
      <View style={styles.top}>
        <Title title="FIUM에 필요한 권한을 설정해주세요" subtitle="필요한 권한을 모두 허용해주세요." />
        <View style={styles.list}>
          <PermRow icon={<PermBluetoothIcon width={24} height={24} />} title="블루투스" body="FIUM과 연결하고 물주기 신호를 전달해요." />
          <PermRow icon={<PermActivityIcon width={24} height={24} />} title="신체 활동" body="움직임을 감지해 물주기에 사용해요." />
          <PermRow icon={<PermStorageIcon width={24} height={24} />} title="저장소" body="활동 기록을 안전하게 저장해요." />
        </View>
      </View>
      <View style={styles.flex} />
    </Screen>
  );
}

function PermRow({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>{icon}</View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowBody}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: { gap: 36 },
  list: { gap: 42 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowTitle: { ...type.subTitle, color: colors.primary[700] },
  rowBody: { ...type.bodySmall, color: colors.primary[500] },
});
