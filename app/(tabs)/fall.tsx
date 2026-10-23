import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { Button } from '../../src/components/Button';
import { Screen } from '../../src/components/Screen';
import { Snackbar } from '../../src/components/Snackbar';
import { Title } from '../../src/components/Title';
import { useStore } from '../../src/data/store';
import { useFlower } from '../../src/ble/FlowerProvider';
import { FALL_HOURS_MAX, FALL_HOURS_MIN } from '../../src/data/types';
import { colors } from '../../src/theme/colors';
import { fonts, type } from '../../src/theme/typography';

const ITEM_H = 76;
const VISIBLE = 5;
const HOURS = Array.from({ length: FALL_HOURS_MAX - FALL_HOURS_MIN + 1 }, (_, i) => i + FALL_HOURS_MIN);
const RANGE_SNACK = '3~48시간 사이로 설정해주세요';

export default function FallTimeScreen() {
  const router = useRouter();
  const flower = useFlower();
  const { state, saveFallHours } = useStore();
  const saved = state.settings.fallHours;
  const [hours, setHours] = useState(saved);
  const [typing, setTyping] = useState(false);
  const [typed, setTyped] = useState(String(saved));
  const [snack, setSnack] = useState<string | null>(null);
  const listRef = useRef<ScrollView>(null);
  const didScroll = useRef(false);
  const interacting = useRef(false);
  const dragged = useRef(false);
  const lastOffset = useRef(0);
  const touchAt = useRef({ y: 0, t: 0 });
  const typedRef = useRef(typed);
  const hoursRef = useRef(hours);
  const inputRef = useRef<TextInput>(null);
  const ignoreTapUntil = useRef(0);
  const typingRef = useRef(false);
  typedRef.current = typed;
  hoursRef.current = hours;
  typingRef.current = typing;
  const hideSnack = useCallback(() => setSnack(null), []);
  const hoursList = useMemo(() => HOURS, []);
  const pad = ITEM_H * Math.floor((VISIBLE - 1) / 2);

  const snapTo = (n: number, animated = true) => {
    listRef.current?.scrollTo({ y: (n - FALL_HOURS_MIN) * ITEM_H, animated });
  };

  const hourFromOffset = (y: number) => {
    const index = Math.round(y / ITEM_H);
    return hoursList[Math.max(0, Math.min(hoursList.length - 1, index))];
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (typing) return;
    lastOffset.current = e.nativeEvent.contentOffset.y;
    const next = hourFromOffset(e.nativeEvent.contentOffset.y);
    setHours((prev) => {
      if (prev === next) return prev;
      if (interacting.current) Haptics.selectionAsync().catch(() => {});
      return next;
    });
  };

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (typing) return;
    const next = hourFromOffset(e.nativeEvent.contentOffset.y);
    setHours(next);
    setTyped(String(next));
    const snapY = (next - FALL_HOURS_MIN) * ITEM_H;
    if (Math.abs(e.nativeEvent.contentOffset.y - snapY) > 1) snapTo(next);
  };

  const startTyping = (n: number) => {
    if (typingRef.current || Date.now() < ignoreTapUntil.current) return;
    setHours(n);
    setTyped(String(n));
    setTyping(true);
  };

  const maybeTapToType = (pageY: number) => {
    if (typingRef.current || Date.now() < ignoreTapUntil.current) return;
    const dy = Math.abs(pageY - touchAt.current.y);
    const dt = Date.now() - touchAt.current.t;
    if (dy > 14 || dt > 320) return;
    startTyping(hourFromOffset(lastOffset.current));
  };

  const endTyping = (n: number) => {
    if (!typingRef.current) return;
    ignoreTapUntil.current = Date.now() + 600;
    typingRef.current = false;
    didScroll.current = false;
    setHours(n);
    setTyped(String(n));
    setTyping(false);
    Keyboard.dismiss();
    inputRef.current?.blur();
    requestAnimationFrame(() => snapTo(n, false));
  };

  const commitTyped = useCallback(() => {
    if (!typingRef.current) return false;
    const n = Number.parseInt(typedRef.current.replace(/[^\d]/g, ''), 10);
    if (!Number.isFinite(n) || n < FALL_HOURS_MIN || n > FALL_HOURS_MAX) {
      setSnack(RANGE_SNACK);
      endTyping(hoursRef.current);
      return false;
    }
    endTyping(n);
    return true;
  }, []);

  useEffect(() => {
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      if (typingRef.current) commitTyped();
    });
    return () => hide.remove();
  }, [commitTyped]);

  const onSave = () => {
    if (typing && !commitTyped()) return;
    saveFallHours(hours);
    if (flower.connection === 'connected') {
      flower.send(`SETTIME:${hours}`).catch(() => {});
    }
  };

  const dirty = hours !== saved;
  const unit = <Text style={styles.unit}>시간</Text>;

  return (
    <View style={styles.page}>
      <Screen nav={{ left: 'back', onLeft: () => router.navigate('/(tabs)/home') }}>
        <View
          style={styles.body}
          onStartShouldSetResponder={() => typing}
          onResponderRelease={() => {
            if (typingRef.current) commitTyped();
          }}
        >
          <View style={styles.head} pointerEvents={typing ? 'none' : 'auto'}>
            <Title title={'설정한 시간 동안\nFIUM이 천천히 떨어져요'} />
            <View style={styles.nowRow}>
              <Text style={styles.nowLabel}>현재 설정 시간</Text>
              <Text style={styles.nowValue}>{saved}시간</Text>
            </View>
          </View>

          <View style={styles.wheelWrap}>
            <View pointerEvents="none" style={styles.glow}>
              <Svg width="100%" height="100%" viewBox="0 0 318 415" preserveAspectRatio="xMidYMid slice">
                <Defs>
                  <RadialGradient id="fallGlow" cx="159" cy="207.5" rx="174" ry="227" gradientUnits="userSpaceOnUse">
                    <Stop offset="0" stopColor={colors.primary.base} stopOpacity={0.75} />
                    <Stop offset="1" stopColor={colors.bg} stopOpacity={1} />
                  </RadialGradient>
                </Defs>
                <Rect x="0" y="0" width="318" height="415" fill="url(#fallGlow)" />
              </Svg>
            </View>
            {typing ? (
              <View style={styles.typeRow}>
                <TextInput
                  ref={inputRef}
                  autoFocus
                  value={typed}
                  onChangeText={(t) => setTyped(t.replace(/[^\d]/g, ''))}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  onSubmitEditing={() => commitTyped()}
                  blurOnSubmit
                  style={styles.numOn}
                  maxLength={2}
                  onStartShouldSetResponder={() => true}
                />
                {unit}
              </View>
            ) : (
              <View style={styles.wheelStage}>
                <ScrollView
                  ref={listRef}
                  style={styles.wheelScroll}
                  showsVerticalScrollIndicator={false}
                  decelerationRate="normal"
                  overScrollMode="never"
                  keyboardShouldPersistTaps="handled"
                  onTouchStart={(e) => {
                    dragged.current = false;
                    touchAt.current = { y: e.nativeEvent.pageY, t: Date.now() };
                  }}
                  onTouchEnd={(e) => {
                    if (!dragged.current) maybeTapToType(e.nativeEvent.pageY);
                  }}
                  onScrollBeginDrag={() => {
                    dragged.current = true;
                    interacting.current = true;
                  }}
                  onScroll={onScroll}
                  onMomentumScrollEnd={(e) => {
                    interacting.current = false;
                    onMomentumScrollEnd(e);
                  }}
                  onScrollEndDrag={(e) => {
                    const vy = e.nativeEvent.velocity?.y ?? 0;
                    if (Math.abs(vy) > 0.25) return;
                    onMomentumScrollEnd(e);
                  }}
                  scrollEventThrottle={16}
                  onLayout={() => {
                    if (didScroll.current) return;
                    didScroll.current = true;
                    snapTo(hours, false);
                  }}
                  contentContainerStyle={{ paddingVertical: pad, alignItems: 'center' }}
                >
                  {hoursList.map((n) => (
                    <View key={n} style={styles.item}>
                      <Text style={n === hours ? styles.numOn : styles.numOff}>{n}</Text>
                    </View>
                  ))}
                </ScrollView>
                <Text pointerEvents="none" style={styles.unitOnWheel}>
                  시간
                </Text>
              </View>
            )}
          </View>

          <View pointerEvents={typing ? 'none' : 'auto'}>
            <Button label="설정하기" disabled={!dirty && !typing} onPress={onSave} />
          </View>
        </View>
      </Screen>
      <Snackbar message={snack} onHide={hideSnack} placement="top" />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  body: { flex: 1, justifyContent: 'space-between', paddingBottom: 20 },
  head: { gap: 16 },
  nowRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  nowLabel: { ...type.bodySmall, color: colors.primary[500] },
  nowValue: { ...type.label, color: colors.primary[600], flex: 1 },
  wheelWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 36 },
  glow: { ...StyleSheet.absoluteFill },
  wheelStage: {
    height: ITEM_H * VISIBLE,
    width: 240,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeRow: {
    height: ITEM_H * VISIBLE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 32,
  },
  wheelScroll: { width: 240, height: ITEM_H * VISIBLE },
  item: { height: ITEM_H, alignItems: 'center', justifyContent: 'center', minWidth: 88 },
  numOn: {
    fontFamily: fonts.extraBold,
    fontSize: 64,
    lineHeight: 76,
    color: colors.primary[700],
    textAlign: 'center',
    minWidth: 88,
    includeFontPadding: false,
  },
  numOff: {
    fontFamily: fonts.extraBold,
    fontSize: 64,
    lineHeight: 76,
    color: colors.grey.light,
    textAlign: 'center',
    includeFontPadding: false,
  },
  unit: {
    ...type.label,
    color: colors.primary[700],
    marginLeft: 16,
  },
  unitOnWheel: {
    ...type.label,
    color: colors.primary[700],
    position: 'absolute',
    left: '50%',
    marginLeft: 48,
    top: '50%',
    marginTop: -8,
  },
});
