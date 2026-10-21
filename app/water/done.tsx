import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { TopNav } from '../../src/components/TopNav';
import { colors } from '../../src/theme/colors';
import { type } from '../../src/theme/typography';

export default function WaterDoneScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <TopNav left="back" light onLeft={() => router.replace('/home')} />
      <View style={styles.contents}>
        <View style={styles.topBlock}>
          <Text style={styles.title}>FIUM에게 물주기가 완료됐어요</Text>
          <Text style={styles.sub}>다시 주려면 홈에서 물주기를 선택해주세요</Text>
          <Text style={styles.waterLabel}>Water</Text>
        </View>
        <Button variant="blue" label="홈으로 가기" onPress={() => router.replace('/home')} />
      </View>
      <View style={{ height: 56 + insets.bottom }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primary[700] },
  contents: { flex: 1, paddingHorizontal: 20, paddingTop: 4, justifyContent: 'space-between', paddingBottom: 8 },
  topBlock: { width: '100%', gap: 8 },
  title: { ...type.title, color: colors.grey.white },
  sub: { ...type.bodyLarge, color: colors.grey.white },
  waterLabel: {
    marginTop: 80,
    fontFamily: type.headingLight.fontFamily,
    fontSize: 24,
    lineHeight: 30,
    color: colors.primary[100],
    textTransform: 'capitalize',
  },
});
