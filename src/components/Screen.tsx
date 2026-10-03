import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { TopNav, TopNavProps } from './TopNav';

/** 피그마에서 탭이 없는 화면은 하단에 Bottom Nav(Hide) 56px 만큼 비워 둔다. */
export const BOTTOM_SPACER = 56;

type Measurable = {
  measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) => void;
};

const ScrollIntoViewContext = createContext<(node: Measurable) => void>(() => {});

/** 인풋이 포커스되면 키보드 위로 스크롤되게 합니다. */
export function useScrollIntoView() {
  return useContext(ScrollIntoViewContext);
}

type ScreenProps = {
  children?: ReactNode;
  /** 상단 내비. 생략하면 높이 56의 빈 공간만 둔다(피그마 Hide). */
  nav?: TopNavProps;
  /** 폼이 길면 true. 키보드도 피합니다. */
  scroll?: boolean;
  /** 화면 하단에 고정할 요소(버튼 등). 콘텐츠 영역 안쪽에 붙는다. */
  footer?: ReactNode;
  /** 탭 없는 화면이면 true: 하단 시스템 바 + 56 여백 확보 */
  safeBottom?: boolean;
  bg?: string;
  contentStyle?: ViewStyle;
};

export function Screen({ children, nav, scroll, footer, safeBottom, bg = colors.bg, contentStyle }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const win = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const viewportRef = useRef<View>(null);
  const scrollY = useRef(0);
  const kbRef = useRef(0);
  const focusedRef = useRef<Measurable | null>(null);
  const [kbHeight, setKbHeight] = useState(0);
  const keyboardOpen = kbHeight > 0;
  const windowResized = keyboardOpen && win.height < Dimensions.get('screen').height - kbHeight * 0.35;
  const bottomPad = keyboardOpen
    ? windowResized
      ? 0
      : kbHeight
    : safeBottom
      ? insets.bottom + BOTTOM_SPACER
      : 0;

  const scrollFocused = useRef(() => {});
  scrollFocused.current = () => {
    const node = focusedRef.current;
    const scroller = scrollRef.current;
    if (!node || !scroller) return;
    node.measureInWindow((_ix, iy, _iw, ih) => {
      viewportRef.current?.measureInWindow((_sx, sy, _sw, sh) => {
        const kb = kbRef.current;
        const currentWinH = Dimensions.get('window').height;
        const currentScreenH = Dimensions.get('screen').height;
        const resized = kb > 0 && currentWinH < currentScreenH - kb * 0.35;
        const kbTop = kb > 0 && !resized ? currentWinH - kb : currentWinH;
        const visibleBottom = Math.min(sy + sh, kbTop) - 20;
        const overlap = iy + ih - visibleBottom;
        if (overlap > 0) {
          scroller.scrollTo({ y: scrollY.current + overlap + 24, animated: true });
        } else if (iy < sy + 12) {
          scroller.scrollTo({ y: Math.max(0, scrollY.current + (iy - sy) - 16), animated: true });
        }
      });
    });
  };

  useEffect(() => {
    const show = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hide = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = Keyboard.addListener(show, (e) => {
      kbRef.current = e.endCoordinates.height;
      setKbHeight(e.endCoordinates.height);
      setTimeout(() => scrollFocused.current(), 50);
      setTimeout(() => scrollFocused.current(), 320);
    });
    const onHide = Keyboard.addListener(hide, () => {
      kbRef.current = 0;
      setKbHeight(0);
    });
    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  const scrollIntoView = useCallback((node: Measurable) => {
    focusedRef.current = node;
    requestAnimationFrame(() => scrollFocused.current());
    setTimeout(() => scrollFocused.current(), 350);
    setTimeout(() => scrollFocused.current(), 650);
  }, []);

  const foot = footer ? (
    <View style={styles.footer} collapsable={false}>
      {footer}
    </View>
  ) : null;

  const scrolled = (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 56 : 0}
    >
      <View ref={viewportRef} style={styles.flex}>
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={[
            styles.content,
            styles.scrollContent,
            keyboardOpen && styles.scrollContentKeyboard,
            contentStyle,
          ]}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          onScroll={(e) => {
            scrollY.current = e.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
        >
          {children}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );

  return (
    <ScrollIntoViewContext.Provider value={scrollIntoView}>
      <View style={[styles.flex, { backgroundColor: bg, paddingTop: insets.top, paddingBottom: bottomPad }]}>
        <TopNav {...(nav ?? { left: 'none' })} />
        {scroll ? scrolled : <View style={[styles.flex, styles.content, contentStyle]}>{children}</View>}
        {foot}
      </View>
    </ScrollIntoViewContext.Provider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 4 },
  scrollContent: { paddingBottom: 24, flexGrow: 1 },
  scrollContentKeyboard: { paddingBottom: 200 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    width: '100%',
    alignSelf: 'stretch',
    zIndex: 2,
    elevation: 4,
  },
});
