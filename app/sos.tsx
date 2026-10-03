import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useFlower } from '../src/ble/FlowerProvider';
import { Button } from '../src/components/Button';
import { Field, Input } from '../src/components/Field';
import { Screen } from '../src/components/Screen';
import { Title } from '../src/components/Title';
import { ADMIN_PHONE, ADMIN_SMS_SHARE, adminCallUrl, adminSmsUrl } from '../src/data/adminContact';
import { exportCsvAndShare } from '../src/data/exportFile';
import { useStore } from '../src/data/store';
import { colors } from '../src/theme/colors';
import { type } from '../src/theme/typography';

export default function SosScreen() {
  const router = useRouter();
  const { state, updateSettings, flushQueue, resetAll } = useStore();
  const flower = useFlower();
  const [sheetUrl, setSheetUrl] = useState(state.settings.sheetUrl);
  const [deviceName, setDeviceName] = useState(state.settings.deviceName);
  const [movePos, setMovePos] = useState('4800');
  const [busy, setBusy] = useState<string | null>(null);

  const saveSettings = () => {
    updateSettings({
      sheetUrl: sheetUrl.trim(),
      deviceName: deviceName.trim() || 'C33_FLOWER_1',
    });
    Alert.alert('저장됨');
  };

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key);
    try {
      await fn();
    } catch (e) {
      Alert.alert('실패', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const confirmReset = () => {
    Alert.alert('모든 기록 삭제', '이 폰의 참가자 기록을 지웁니다. 되돌릴 수 없습니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await flower.disconnect().catch(() => {});
          await resetAll();
          router.replace('/onboarding');
        },
      },
    ]);
  };

  return (
    <Screen
      safeBottom
      scroll
      nav={{ left: 'close', onLeft: () => router.back() }}
    >
      <Title title="관리자" subtitle="참가자에게는 보이지 않는 화면입니다." />

      <View style={styles.card}>
        <Text style={styles.kicker}>비상 연락</Text>
        <Text style={styles.body}>{ADMIN_PHONE}</Text>
        <Text style={styles.meta}>문자 공유 {ADMIN_SMS_SHARE}</Text>
        <View style={styles.row}>
          <Button variant="small" label="전화" onPress={() => Linking.openURL(adminCallUrl())} />
          <Button
            variant="small"
            label="문자"
            onPress={() =>
              Linking.openURL(
                adminSmsUrl(
                  `[피움 SOS] ${state.profile?.participantId ?? ''} ${state.profile?.name ?? ''} {여기 문제 상황을 설명해주세요}`,
                ),
              )
            }
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.kicker}>데이터</Text>
        <Text style={styles.meta}>
          물주기 {state.waterEvents.length}건 · 일일 기록 {state.diary.length}건 · 전송 대기 {state.queue.length}건
        </Text>
        <View style={styles.row}>
          <Button
            variant="small"
            label="CSV 내보내기"
            loading={busy === 'export'}
            onPress={() => run('export', () => exportCsvAndShare(state))}
          />
          <Button
            variant="small"
            label="시트로 지금 전송"
            disabled={!state.settings.sheetUrl || state.queue.length === 0}
            loading={busy === 'flush'}
            onPress={() => run('flush', flushQueue)}
          />
        </View>
      </View>

      <Field label="구글 시트 웹앱 URL" helper="docs/apps-script.gs 배포 후 나오는 /exec 주소. 비우면 로컬만 저장.">
        <Input
          value={sheetUrl}
          onChangeText={setSheetUrl}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="https://script.google.com/macros/s/.../exec"
        />
      </Field>
      <Field label="화분 BLE 이름">
        <Input value={deviceName} onChangeText={setDeviceName} autoCapitalize="characters" autoCorrect={false} />
      </Field>
      <Button variant="outline" label="설정 저장" onPress={saveSettings} style={styles.saveBtn} />

      <View style={styles.card}>
        <Text style={styles.kicker}>
          화분 제어 · {flower.kind === 'mock' ? '가상' : 'BLE'} · {flower.connection}
        </Text>
        <Text style={styles.meta}>
          {flower.status ? flower.status.raw : '상태 없음'}
          {flower.pos !== null ? `  (시듦 ${flower.wiltPercent}%)` : ''}
        </Text>
        <View style={styles.row}>
          {flower.connection === 'connected' ? (
            <Button variant="ghost" label="연결 끊기" onPress={flower.disconnect} />
          ) : (
            <Button variant="small" label="연결" onPress={flower.connect} />
          )}
          <Button
            variant="small"
            label="RESET (개화)"
            disabled={flower.connection !== 'connected'}
            onPress={() => run('reset', () => flower.send('RESET'))}
          />
          <Button
            variant="small"
            label="TEST"
            disabled={flower.connection !== 'connected'}
            onPress={() => run('test', () => flower.send('TEST'))}
          />
        </View>
        <View style={[styles.row, styles.rowTop]}>
          <Input value={movePos} onChangeText={setMovePos} keyboardType="number-pad" style={styles.posInput} />
          <Button
            variant="small"
            label="MOVEPOS"
            disabled={flower.connection !== 'connected'}
            onPress={() => run('move', () => flower.send(`MOVEPOS:${Number(movePos) || 0}`))}
          />
          <Button
            variant="small"
            label="SETPOS"
            disabled={flower.connection !== 'connected'}
            onPress={() => run('set', () => flower.send(`SETPOS:${Number(movePos) || 0}`))}
          />
        </View>
        {flower.lastError ? <Text style={styles.err}>{flower.lastError}</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.kicker}>실험 종료</Text>
        <Text style={styles.body}>CSV를 먼저 내보낸 뒤, 다음 참가자를 위해 기록을 지웁니다.</Text>
        <View style={styles.row}>
          <Button variant="danger" label="모든 기록 삭제" onPress={confirmReset} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.grey.white,
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  kicker: { ...type.label, color: colors.primary[500], marginBottom: 8 },
  body: { ...type.bodyLarge, color: colors.text },
  meta: { ...type.bodySmall, color: colors.textMuted },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  rowTop: { alignItems: 'center' },
  posInput: { flex: 1, minWidth: 90, height: 44 },
  saveBtn: { marginTop: 16, marginBottom: 8 },
  err: { marginTop: 8, ...type.caption, color: colors.grey[400] },
});
