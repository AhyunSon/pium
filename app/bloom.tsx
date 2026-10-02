import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../src/components/Button';
import { Screen } from '../src/components/Screen';
import { colors } from '../src/theme/colors';

export default function BloomScreen() {
  const router = useRouter();
  const { wilt, connected } = useLocalSearchParams<{ wilt?: string; connected?: string }>();
  const isConnected = connected === '1';
  const wiltNum = wilt ? Number(wilt) : null;

  return (
    <Screen
      safeBottom
      footer={
        <View style={styles.footer}>
          <Button label="오늘 기록 남기기" onPress={() => router.replace('/diary')} />
          <Button variant="ghost" label="홈으로" onPress={() => router.replace('/home')} />
        </View>
      }
    >
      <View style={styles.center}>
        <View style={styles.badge} />
        <Text style={styles.title}>{isConnected ? '물을 주었습니다' : '기록했습니다'}</Text>
        <Text style={styles.body}>
          {isConnected
            ? '화분을 봐 주세요. 꽃이 천천히 피어납니다.'
            : '화분과 연결되지 않아 꽃은 피지 않았습니다. 연결 후 다시 물을 주어도 됩니다.'}
        </Text>
        {wiltNum !== null && !Number.isNaN(wiltNum) ? (
          <Text style={styles.meta}>물을 줄 때 꽃은 {wiltNum}% 시들어 있었습니다</Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.yellow[100],
    marginBottom: 28,
  },
  title: { fontSize: 24, fontWeight: '600', color: colors.text, marginBottom: 12 },
  body: { fontSize: 16, lineHeight: 24, color: colors.textMuted, textAlign: 'center' },
  meta: { marginTop: 20, fontSize: 13, color: colors.gray[300] },
  footer: { gap: 6 },
});
