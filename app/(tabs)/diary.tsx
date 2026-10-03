import { useRouter } from 'expo-router';
import { Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { Chip } from '../../src/components/Chip';
import { Screen } from '../../src/components/Screen';
import { useStore } from '../../src/data/store';
import { formatDiaryDate, pad2, studyDates, studyDay, toDateKey } from '../../src/data/time';
import { STUDY_DAYS } from '../../src/data/types';
import { colors } from '../../src/theme/colors';
import { LockIcon } from '../../src/theme/icons';
import { fonts, type } from '../../src/theme/typography';

type CardKind = 'done' | 'write' | 'locked';

function kindFor(date: string, today: string, hasEntry: boolean, start: string): CardKind {
  if (hasEntry) return 'done';
  if (date > today) return 'locked';
  if (date < start) return 'locked';
  return 'write';
}

export default function DiaryScreen() {
  const router = useRouter();
  const { state } = useStore();
  const today = toDateKey();
  const start = state.profile?.studyStartDate ?? today;
  const day = state.profile ? studyDay(start, today) : null;
  const days = studyDates(start, STUDY_DAYS);

  const open = (date: string, hasEntry: boolean) => {
    router.push({
      pathname: hasEntry ? '/survey/1' : '/survey',
      params: { date, mode: hasEntry ? 'review' : 'write' },
    });
  };

  return (
    <Screen nav={{ left: 'logo', rightText: day ? `DAY ${pad2(day)} / ${pad2(STUDY_DAYS)}` : undefined }}>
      <View style={styles.grid}>
        <View style={styles.topRow}>
          <View style={styles.intro}>
            <View style={styles.introText}>
              <Text style={styles.introTitle}>다이어리</Text>
              <Text style={styles.introSub}>Four Days with FIUM</Text>
              <View style={styles.introRule} />
              <Text style={styles.introBody}>{`FIUM과 함께한\n4일간의 기록을\n확인해보세요.`}</Text>
            </View>
            <Image source={require('../../assets/images/flower-falling.png')} style={styles.introFlower} resizeMode="contain" />
          </View>
          <View style={styles.col}>
            {days.slice(0, 2).map((d) => {
              const hasEntry = state.diary.some((e) => e.date === d.date);
              const kind = kindFor(d.date, today, hasEntry, start);
              return (
                <DayCard
                  key={d.date}
                  day={d.day}
                  date={d.date}
                  kind={kind}
                  onPress={() => {
                    if (kind === 'locked') return;
                    open(d.date, hasEntry);
                  }}
                />
              );
            })}
          </View>
        </View>
        <View style={styles.bottomRow}>
          {days.slice(2).map((d) => {
            const hasEntry = state.diary.some((e) => e.date === d.date);
            const kind = kindFor(d.date, today, hasEntry, start);
            return (
              <DayCard
                key={d.date}
                day={d.day}
                date={d.date}
                kind={kind}
                onPress={() => {
                  if (kind === 'locked') return;
                  open(d.date, hasEntry);
                }}
              />
            );
          })}
        </View>
      </View>
    </Screen>
  );
}

function DayCard({
  day,
  date,
  kind,
  onPress,
}: {
  day: number;
  date: string;
  kind: CardKind;
  onPress: () => void;
}) {
  const { short, weekday } = formatDiaryDate(date);
  const header = (
    <View style={styles.cardHead}>
      <View>
        <View style={styles.dayRow}>
          <Text style={styles.dayLabel}>DAY</Text>
          <Text style={styles.dayNum}>{pad2(day)}</Text>
        </View>
        <View style={styles.dateRow}>
          <Text style={styles.dateShort}>{short}</Text>
          <Text style={styles.dateWeek}>({weekday})</Text>
        </View>
      </View>
      {kind === 'done' ? <Chip label="완료됨" tone="outline" style={styles.doneChip} /> : null}
      {kind === 'write' ? <Chip label="미완료" /> : null}
    </View>
  );

  if (kind === 'locked') {
    return (
      <View style={[styles.card, styles.cardPlain]}>
        {header}
        <View style={styles.lockCircle}>
          <LockIcon width={24} height={24} />
          <Text style={styles.lockText}>{`아직 기록할 수\n없는 날짜예요`}</Text>
        </View>
      </View>
    );
  }

  const bg = kind === 'done' ? require('../../assets/images/bg-daycard-done.png') : require('../../assets/images/bg-daycard-write.png');

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <ImageBackground source={bg} style={styles.cardBg} imageStyle={styles.cardBgImg}>
        {header}
        <View style={styles.cardMid}>
          <Text style={styles.cardMsg}>
            {kind === 'done' ? (
              <>
                {day}일차의 기록을{'\n'}
                <Text style={styles.cardMsgEm}>남겼어요</Text>
              </>
            ) : (
              <>
                오늘의 기록을{'\n'}
                <Text style={styles.cardMsgEm}>남겨주세요!</Text>
              </>
            )}
          </Text>
        </View>
      </ImageBackground>
      <Button
        variant={kind === 'done' ? 'cardFootMuted' : 'cardFoot'}
        label={kind === 'done' ? '작성한 답변 보기' : '작성하러 가기'}
        onPress={onPress}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grid: { flex: 1, gap: 12 },
  topRow: { flex: 2, flexDirection: 'row', gap: 8 },
  bottomRow: { flex: 1, flexDirection: 'row', gap: 8 },
  col: { flex: 1, gap: 8 },
  intro: {
    flex: 1,
    backgroundColor: colors.primary[100],
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 20,
    justifyContent: 'space-between',
  },
  introText: { gap: 3 },
  introTitle: { ...type.title, color: colors.primary[700] },
  introSub: { ...type.caption, color: colors.primary[500] },
  introRule: { width: 28, height: 1, backgroundColor: colors.primary[400], marginVertical: 12 },
  introBody: { ...type.bodySmall, color: colors.primary[700] },
  introFlower: { width: 138, height: 167, alignSelf: 'center' },
  card: { flex: 1, minHeight: 160, borderRadius: 8, overflow: 'hidden' },
  cardPlain: {
    backgroundColor: colors.grey.white,
    paddingTop: 16,
    paddingHorizontal: 12,
    paddingBottom: 12,
    justifyContent: 'space-between',
  },
  cardBg: { flex: 1, paddingTop: 16, paddingBottom: 12 },
  cardBgImg: { borderRadius: 8 },
  cardMid: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 16 },
  doneChip: { paddingHorizontal: 6 },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dayLabel: { fontFamily: fonts.semiBold, fontSize: 15, lineHeight: 16, color: colors.primary[700] },
  dayNum: { fontFamily: fonts.semiBold, fontSize: 15, lineHeight: 16, color: colors.grey[700] },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 3 },
  dateShort: { ...type.caption, color: colors.grey[400] },
  dateWeek: { ...type.caption, color: colors.grey[400] },
  cardMsg: { ...type.bodyLarge, color: colors.primary[700], textAlign: 'center', alignSelf: 'center' },
  cardMsgEm: { fontFamily: fonts.semiBold },
  lockCircle: {
    width: 116,
    height: 116,
    borderRadius: 64,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.grey[500],
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 8,
    paddingBottom: 8,
  },
  lockText: { ...type.bodySmall, color: colors.grey[500], textAlign: 'center' },
});
