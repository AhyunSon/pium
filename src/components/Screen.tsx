import { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

type ScreenProps = {
  title?: string;
  hint?: string;
  children?: ReactNode;
  /** 폼이 길면 true. 키보드도 피합니다. */
  scroll?: boolean;
  /** 화면 하단에 고정할 요소(버튼 등) */
  footer?: ReactNode;
  right?: ReactNode;
  /**
   * 탭바가 없는 화면(온보딩·개화·관리자)에서 true.
   * 하단 시스템 바(제스처/3버튼) 높이만큼 아래 여백을 확보합니다.
   * 탭 화면은 탭바가 이미 그 여백을 갖고 있으므로 기본값 false.
   */
  safeBottom?: boolean;
};

export function Screen({ title, hint, children, scroll, footer, right, safeBottom }: ScreenProps) {
  const header =
    title || hint ? (
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {right}
        </View>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
    ) : null;

  const body = scroll ? (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {header}
        {children}
      </ScrollView>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </KeyboardAvoidingView>
  ) : (
    <View style={styles.flex}>
      <View style={[styles.flex, styles.body]}>
        {header}
        {children}
      </View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );

  return (
    <SafeAreaView
      style={styles.safe}
      edges={safeBottom ? ['top', 'left', 'right', 'bottom'] : ['top', 'left', 'right']}
    >
      {body}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  body: { paddingHorizontal: 24, paddingTop: 16 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 },
  header: { marginBottom: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 22, fontWeight: '600', color: colors.text },
  hint: { marginTop: 6, fontSize: 14, lineHeight: 21, color: colors.textMuted },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: colors.bg,
  },
});
