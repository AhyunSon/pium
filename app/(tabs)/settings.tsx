import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { Screen } from '../../src/components/Screen';
import { Title } from '../../src/components/Title';
import { adminSmsUrl } from '../../src/data/adminContact';
import { exportCsvAndShare } from '../../src/data/exportFile';
import { useStore } from '../../src/data/store';
import { colors } from '../../src/theme/colors';
import { DownloadIcon, SosIcon } from '../../src/theme/icons';
import { type } from '../../src/theme/typography';

export default function SettingsScreen() {
  const router = useRouter();
  const { state } = useStore();
  const p = state.profile;
  const [exporting, setExporting] = useState(false);

  const exportData = async () => {
    setExporting(true);
    try {
      await exportCsvAndShare(state);
    } catch (e) {
      Alert.alert('내보내기 실패', e instanceof Error ? e.message : '다시 시도해 주세요.');
    } finally {
      setExporting(false);
    }
  };

  const notifyAdmin = () => {
    const body = `[피움] 도움이 필요해요. ${p?.participantId ?? ''} ${p?.name ?? ''} {여기 문제 상황을 설명해주세요}`;
    Linking.openURL(adminSmsUrl(body)).catch(() => {
      Alert.alert('문자를 열 수 없어요', '문자 앱에서 관리자에게 직접 보내 주세요.');
    });
  };

  return (
    <Screen scroll nav={{ left: 'back', onLeft: () => router.navigate('/home') }}>
      <Title title="설정" subtitle="프로필과 기록을 확인할 수 있어요." />
      <View style={styles.stack}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>프로필 정보</Text>
          <View style={styles.rows}>
            <Info label="이름" value={p?.name ?? ''} />
            <Info label="연령대" value={p?.ageGroup ?? ''} />
            <Info label="목표 습관" value={p?.habit ?? ''} />
            <Info label="기기번호" value={p?.deviceNumber ?? ''} large />
          </View>
        </View>

        <View style={[styles.card, styles.cardTop]}>
          <View style={styles.exportRow}>
            <View style={styles.exportText}>
              <Text style={styles.cardTitle}>활동 데이터 내보내기</Text>
              <Text style={styles.cardHint}>기록된 데이터를 파일로 저장해요.</Text>
            </View>
            <Button
              variant="small"
              label="저장"
              icon={<DownloadIcon width={24} height={24} />}
              loading={exporting}
              onPress={exportData}
            />
          </View>
        </View>

        <View>
          <View style={[styles.card, styles.cardTop]}>
            <View style={styles.sosRow}>
              <SosIcon width={40} height={40} />
              <View style={styles.exportText}>
                <Text style={styles.cardTitle}>도움이 필요하신가요?</Text>
                <Text style={styles.sosHint}>FIUM 또는 앱에 문제가 있을 경우 아래 버튼을 눌러 관리자에게 알려주세요.</Text>
              </View>
            </View>
          </View>
          <Button variant="cardFoot" label="관리자에게 알리기" onPress={notifyAdmin} />
        </View>

        <Pressable onLongPress={() => router.push('/sos')} delayLongPress={900} style={styles.hidden}>
          <Text style={styles.hiddenLabel}>FIUM · {p?.participantId ?? ''}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

function Info({ label, value, large }: { label: string; value: string; large?: boolean }) {
  return (
    <View style={styles.info}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, large && styles.infoValueLarge]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { marginTop: 36, gap: 8 },
  card: {
    backgroundColor: colors.grey.white,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  cardTop: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  cardTitle: { ...type.bodyLarge, color: colors.primary[700] },
  cardHint: { ...type.bodySmall, color: colors.grey[500], marginTop: 5 },
  rows: { marginTop: 20, gap: 5 },
  info: { flexDirection: 'row', gap: 24, alignItems: 'flex-start' },
  infoLabel: { ...type.bodySmall, color: colors.primary[500], width: 52 },
  infoValue: { ...type.label, color: colors.primary[600], flex: 1 },
  infoValueLarge: { ...type.bodyLarge, color: colors.primary[600] },
  exportRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  exportText: { flex: 1, gap: 5 },
  sosRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  sosHint: { ...type.bodySmall, color: colors.grey[400] },
  hidden: { marginTop: 24, alignSelf: 'center', padding: 12 },
  hiddenLabel: { ...type.caption, color: colors.grey[200] },
});
