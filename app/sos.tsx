import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { useFlower } from '../src/ble/FlowerProvider';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { Field, Input } from '../src/components/Field';
import { Screen } from '../src/components/Screen';
import { exportCsvAndShare } from '../src/data/exportFile';
import { useStore } from '../src/data/store';
import { colors } from '../src/theme/colors';

export default function SosScreen() {
  const router = useRouter();
  const { state, updateSettings, flushQueue, resetAll } = useStore();
  const flower = useFlower();
  const [sheetUrl, setSheetUrl] = useState(state.settings.sheetUrl);
  const [adminPhone, setAdminPhone] = useState(state.settings.adminPhone);
  const [deviceName, setDeviceName] = useState(state.settings.deviceName);
  const [movePos, setMovePos] = useState('4800');
  const [busy, setBusy] = useState<string | null>(null);

  const saveSettings = () => {
    updateSettings({ sheetUrl: sheetUrl.trim(), adminPhone: adminPhone.trim(), deviceName: deviceName.trim() || 'C33_FLOWER_1' });
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
          await resetAll();
          router.replace('/onboarding');
        },
      },
    ]);
  };

  return (
    <Screen
      scroll
      title="관리자"
      hint="참가자에게는 보이지 않는 화면입니다."
      right={<Button small variant="ghost" label="닫기" onPress={() => router.back()} />}
    >
      <Card kicker="비상 연락">
        <Text style={styles.body}>{state.settings.adminPhone || '연락처 미설정'}</Text>
        <View style={styles.row}>
          <Button
            small
            variant="secondary"
            label="전화"
            disabled={!state.settings.adminPhone}
            onPress={() => Linking.openURL(`tel:${state.settings.adminPhone}`)}
          />
          <Button
            small
            variant="secondary"
            label="문자"
            disabled={!state.settings.adminPhone}
            onPress={() =>
              Linking.openURL(
                `sms:${state.settings.adminPhone}?body=${encodeURIComponent(
                  `[피움 SOS] ${state.profile?.participantId ?? ''} ${state.profile?.name ?? ''}`,
                )}`,
              )
            }
          />
        </View>
      </Card>

      <Card kicker="데이터">
        <Text style={styles.meta}>
          물주기 {state.waterEvents.length}건 · 일일 기록 {state.diary.length}건 · 전송 대기 {state.queue.length}건
        </Text>
        <View style={styles.row}>
          <Button
            small
            variant="secondary"
            label="CSV 내보내기"
            loading={busy === 'export'}
            onPress={() => run('export', () => exportCsvAndShare(state))}
          />
          <Button
            small
            variant="secondary"
            label="시트로 지금 전송"
            disabled={!state.settings.sheetUrl || state.queue.length === 0}
            loading={busy === 'flush'}
            onPress={() => run('flush', flushQueue)}
          />
        </View>
      </Card>

      <Field label="구글 시트 웹앱 URL" helper="docs/apps-script.gs 배포 후 나오는 /exec 주소. 비우면 로컬만 저장.">
        <Input value={sheetUrl} onChangeText={setSheetUrl} autoCapitalize="none" autoCorrect={false} placeholder="https://script.google.com/macros/s/.../exec" />
      </Field>
      <Field label="관리자 연락처">
        <Input value={adminPhone} onChangeText={setAdminPhone} keyboardType="phone-pad" placeholder="010-0000-0000" />
      </Field>
      <Field label="화분 BLE 이름">
        <Input value={deviceName} onChangeText={setDeviceName} autoCapitalize="characters" autoCorrect={false} />
      </Field>
      <Button variant="secondary" label="설정 저장" onPress={saveSettings} style={styles.saveBtn} />

      <Card kicker={`화분 제어 · ${flower.kind === 'mock' ? '가상' : 'BLE'} · ${flower.connection}`}>
        <Text style={styles.meta}>
          {flower.status ? flower.status.raw : '상태 없음'}
          {flower.pos !== null ? `  (시듦 ${flower.wiltPercent}%)` : ''}
        </Text>
        <View style={styles.row}>
          {flower.connection === 'connected' ? (
            <Button small variant="ghost" label="연결 끊기" onPress={flower.disconnect} />
          ) : (
            <Button small variant="secondary" label="연결" onPress={flower.connect} />
          )}
          <Button
            small
            variant="secondary"
            label="RESET (개화)"
            disabled={flower.connection !== 'connected'}
            onPress={() => run('reset', () => flower.send('RESET'))}
          />
          <Button
            small
            variant="secondary"
            label="TEST"
            disabled={flower.connection !== 'connected'}
            onPress={() => run('test', () => flower.send('TEST'))}
          />
        </View>
        <View style={[styles.row, styles.rowTop]}>
          <Input value={movePos} onChangeText={setMovePos} keyboardType="number-pad" style={styles.posInput} />
          <Button
            small
            variant="secondary"
            label="MOVEPOS"
            disabled={flower.connection !== 'connected'}
            onPress={() => run('move', () => flower.send(`MOVEPOS:${Number(movePos) || 0}`))}
          />
          <Button
            small
            variant="secondary"
            label="SETPOS"
            disabled={flower.connection !== 'connected'}
            onPress={() => run('set', () => flower.send(`SETPOS:${Number(movePos) || 0}`))}
          />
        </View>
        {flower.lastError ? <Text style={styles.err}>{flower.lastError}</Text> : null}
      </Card>

      <Card kicker="실험 종료">
        <Text style={styles.body}>CSV를 먼저 내보낸 뒤, 다음 참가자를 위해 기록을 지웁니다.</Text>
        <View style={styles.row}>
          <Button small variant="danger" label="모든 기록 삭제" onPress={confirmReset} />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: 15, color: colors.text, lineHeight: 22 },
  meta: { fontSize: 13, color: colors.textMuted, lineHeight: 20 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  rowTop: { alignItems: 'center' },
  posInput: { flex: 1, minWidth: 90, paddingVertical: 8 },
  saveBtn: { marginBottom: 20 },
  err: { marginTop: 8, fontSize: 12, color: colors.gray[300] },
});
