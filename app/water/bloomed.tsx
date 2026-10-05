import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { Screen } from '../../src/components/Screen';
import { Title } from '../../src/components/Title';
import { useStore } from '../../src/data/store';
import { pad2, studyDay, toDateKey } from '../../src/data/time';
import { colors } from '../../src/theme/colors';
import { type } from '../../src/theme/typography';

export default function BloomedScreen() {
  const router = useRouter();
  const { state } = useStore();
  const day = state.profile ? studyDay(state.profile.studyStartDate, toDateKey()) : null;

  return (
    <View style={styles.root}>
      <Image source={require('../../assets/images/bg-bloomed.png')} style={styles.bg} resizeMode="cover" />
      <Screen
        bg="transparent"
        safeBottom
        nav={{ left: 'back', onLeft: () => router.replace('/home') }}
        footer={
          <Button
            label="오늘 기록 남기기"
            onPress={() =>
              router.replace({ pathname: '/survey', params: { date: toDateKey(), from: 'water' } })
            }
          />
        }
        contentStyle={styles.content}
      >
        <Title title="오늘도 피워냈어요!" subtitle="작은 실천이 오늘의 FIUM을 피웠어요." />
        <View style={styles.mid}>
          <View style={styles.summary}>
            <Text style={styles.kicker}>Today&apos;s Habit</Text>
            <Text style={styles.habit} numberOfLines={3}>
              {state.profile?.habit ?? ''}
            </Text>
            <View style={styles.rule} />
            <Text style={styles.day}>{day ? `DAY ${pad2(day)}` : ''}</Text>
          </View>
        </View>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  bg: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, width: '100%', height: '100%' },
  content: { flex: 1 },
  mid: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingLeft: 110,
  },
  summary: { width: '100%', maxWidth: 220, gap: 8, alignItems: 'flex-start' },
  kicker: { ...type.label, color: colors.primary[400] },
  habit: { ...type.subTitle, color: colors.primary[700] },
  rule: { height: 1, width: '100%', backgroundColor: colors.primary[300], marginVertical: 6 },
  day: { ...type.bodyLarge, fontFamily: type.label.fontFamily, color: colors.primary[400], alignSelf: 'flex-end' },
});
