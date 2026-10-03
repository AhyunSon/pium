import { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { colors } from '../theme/colors';
import { type } from '../theme/typography';

/**
 * 피그마 버튼 세트
 * - large:    Button/Large. h56 r8 다크 올리브 (설정하기, 다음, 시작하기, 저장하기). 비활성 = grey300
 * - largeMuted: 설문 리뷰의 「다음」. grey400, 눌러짐
 * - outlineMuted: 설문 리뷰의 「이전」. grey400 테두리, 눌러짐
 * - blue:     Water_Done의 「오늘 기록 남기기」 (secondary400)
 * - outline:  「이전」. 투명 배경 + 다크 테두리
 * - pill:     Button/Connect Button. h44 w112 r28 테두리 (연결하기 / 연결 끊기), 아이콘 슬롯
 * - pillDark: 연결 중. 다크 채움 + 밝은 글자
 * - choice:   설문 예/아니오. h48 r28. 선택 시 노랑 + SemiBold
 * - small:    설정의 「저장」. h36, primary100
 * - smallMid: 설문 탑 내비 「수정」. h36, primary500
 * - smallDark: 설문 탑 내비 「저장」. h36, primary700
 * - cardFoot: 다이어리 카드 하단 「작성하러 가기」 (h44, 아래 모서리만 r8)
 * - ghost:    텍스트만
 */
type Variant =
  | 'large'
  | 'largeMuted'
  | 'blue'
  | 'outline'
  | 'outlineMuted'
  | 'pill'
  | 'pillDark'
  | 'choice'
  | 'small'
  | 'smallMid'
  | 'smallDark'
  | 'cardFoot'
  | 'cardFootMuted'
  | 'ghost'
  | 'danger';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  /** choice 전용: 선택 여부 */
  selected?: boolean;
  /** 라벨 오른쪽 아이콘 */
  icon?: ReactNode;
  style?: ViewStyle;
  labelStyle?: TextStyle;
};

export function Button({
  label,
  onPress,
  variant = 'large',
  disabled,
  loading,
  selected,
  icon,
  style,
  labelStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const v = variants[variant];
  const fill = FILL_VARIANTS.has(variant);
  const wrap = [
    styles.base,
    v.wrap,
    variant === 'choice' && selected && styles.choiceSelected,
    isDisabled && v.disabled,
  ];
  const text = [
    v.label,
    variant === 'choice' && selected && styles.choiceSelectedLabel,
    isDisabled && v.disabledLabel,
    labelStyle,
  ];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={isDisabled}
      android_ripple={{ color: 'rgba(255,255,255,0.12)' }}
      style={({ pressed }) => [wrap, pressed && !isDisabled && v.pressed, style]}
    >
      {loading && !icon ? (
        <ActivityIndicator color={(v.label as TextStyle).color as string} />
      ) : (
        <View style={[styles.row, fill && styles.rowFill]} pointerEvents="none">
          <Text style={text} numberOfLines={1}>
            {label}
          </Text>
          {icon}
        </View>
      )}
    </Pressable>
  );
}

const FILL_VARIANTS = new Set<Variant>([
  'large',
  'largeMuted',
  'blue',
  'outline',
  'outlineMuted',
  'choice',
  'cardFoot',
  'cardFootMuted',
  'danger',
]);

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  rowFill: { width: '100%', height: '100%' },
  choiceSelected: { backgroundColor: colors.primary[100] },
  choiceSelectedLabel: { color: colors.primary[700], fontFamily: type.label.fontFamily },
});

type VariantStyle = {
  wrap: ViewStyle;
  pressed: ViewStyle;
  label: TextStyle;
  disabled: ViewStyle;
  disabledLabel: TextStyle;
};

const cardFootLabel: TextStyle = {
  ...type.label,
  lineHeight: 18,
  textAlign: 'center',
  textAlignVertical: 'center',
  includeFontPadding: false,
};

const largeBase: ViewStyle = { height: 56, borderRadius: 8, paddingHorizontal: 10, width: '100%', alignSelf: 'stretch' };
const largeLabel: TextStyle = { ...type.subTitle, textAlign: 'center' };
const pillBase: ViewStyle = {
  height: 44,
  minWidth: 112,
  paddingHorizontal: 12,
  borderRadius: 28,
  borderWidth: 1,
};

const variants: Record<Variant, VariantStyle> = {
  large: {
    wrap: { ...largeBase, backgroundColor: colors.primary[700] },
    pressed: { backgroundColor: colors.primary[600] },
    label: { ...largeLabel, color: colors.grey.white },
    disabled: { backgroundColor: colors.grey[300] },
    disabledLabel: { color: colors.grey.light },
  },
  largeMuted: {
    wrap: { ...largeBase, backgroundColor: colors.grey[400] },
    pressed: { backgroundColor: colors.grey[500] },
    label: { ...largeLabel, color: colors.grey.white },
    disabled: { backgroundColor: colors.grey[300] },
    disabledLabel: { color: colors.grey.light },
  },
  blue: {
    wrap: { ...largeBase, backgroundColor: colors.secondary[400] },
    pressed: { backgroundColor: colors.secondary[500] },
    label: { ...largeLabel, color: colors.grey.white },
    disabled: { backgroundColor: colors.grey[300] },
    disabledLabel: { color: colors.grey.light },
  },
  outline: {
    wrap: { ...largeBase, backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary[700] },
    pressed: { backgroundColor: colors.primary.base },
    label: { ...largeLabel, color: colors.primary[700] },
    disabled: { borderColor: colors.grey[300] },
    disabledLabel: { color: colors.grey[300] },
  },
  outlineMuted: {
    wrap: { ...largeBase, backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.grey[400] },
    pressed: { backgroundColor: colors.grey.base },
    label: { ...largeLabel, color: colors.grey[400] },
    disabled: { borderColor: colors.grey[300] },
    disabledLabel: { color: colors.grey[300] },
  },
  pill: {
    wrap: { ...pillBase, borderColor: colors.primary[700], backgroundColor: 'transparent' },
    pressed: { backgroundColor: colors.primary.base },
    label: { ...type.label, color: colors.primary[700] },
    disabled: { borderColor: colors.grey[300] },
    disabledLabel: { color: colors.grey[300] },
  },
  pillDark: {
    wrap: { ...pillBase, borderColor: colors.primary[700], backgroundColor: colors.primary[700] },
    pressed: { backgroundColor: colors.primary[600] },
    label: { ...type.label, color: colors.grey.base },
    disabled: {},
    disabledLabel: {},
  },
  choice: {
    wrap: { flex: 1, height: 48, borderRadius: 28, backgroundColor: colors.grey.white },
    pressed: { backgroundColor: colors.primary.base },
    label: { fontFamily: type.bodySmall.fontFamily, fontSize: 15, lineHeight: 16, color: colors.grey[300] },
    disabled: {},
    disabledLabel: {},
  },
  small: {
    wrap: { height: 36, paddingHorizontal: 12, borderRadius: 5, backgroundColor: colors.primary[100] },
    pressed: { backgroundColor: colors.primary[200] },
    label: { ...type.label, color: colors.grey[600] },
    disabled: { backgroundColor: colors.grey[200] },
    disabledLabel: { color: colors.grey[400] },
  },
  smallMid: {
    wrap: { height: 36, paddingHorizontal: 10, borderRadius: 5, backgroundColor: colors.primary[500] },
    pressed: { backgroundColor: colors.primary[600] },
    label: { ...type.bodyLarge, color: colors.grey.white },
    disabled: { backgroundColor: colors.grey[300] },
    disabledLabel: { color: colors.grey.light },
  },
  smallDark: {
    wrap: { height: 36, paddingHorizontal: 10, borderRadius: 5, backgroundColor: colors.primary[700] },
    pressed: { backgroundColor: colors.primary[600] },
    label: { ...type.bodyLarge, color: colors.grey.white },
    disabled: { backgroundColor: colors.grey[300] },
    disabledLabel: { color: colors.grey.light },
  },
  cardFoot: {
    wrap: {
      height: 44,
      width: '100%',
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8,
      backgroundColor: colors.primary[700],
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: { backgroundColor: colors.primary[600] },
    label: { ...cardFootLabel, color: colors.grey.white },
    disabled: { backgroundColor: colors.grey[300] },
    disabledLabel: { color: colors.grey.light },
  },
  cardFootMuted: {
    wrap: {
      height: 44,
      width: '100%',
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8,
      backgroundColor: colors.grey.light,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: { backgroundColor: colors.grey[200] },
    label: { ...cardFootLabel, color: colors.primary[700] },
    disabled: { opacity: 0.6 },
    disabledLabel: {},
  },
  ghost: {
    wrap: { height: 44, paddingHorizontal: 12, borderRadius: 10, backgroundColor: 'transparent' },
    pressed: { backgroundColor: colors.grey[200] },
    label: { ...type.label, color: colors.textMuted },
    disabled: { opacity: 0.5 },
    disabledLabel: {},
  },
  danger: {
    wrap: { ...largeBase, backgroundColor: colors.grey.white, borderWidth: 1, borderColor: '#E0B4B4' },
    pressed: { backgroundColor: '#FBECEC' },
    label: { ...type.label, color: '#9A3B3B' },
    disabled: { opacity: 0.5 },
    disabledLabel: {},
  },
};
