import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

/**
 * 피그마 Chip/Connection Status, Watering Status.
 * - filled:  h20 r4 primary500 바탕 + 흰 글자 (연결됨 / 연결 실패 / 미완료)
 * - outline: h22 r4 grey500 테두리 + grey600 글자 (완료됨)
 * - blue:    h20 r4 secondary400 바탕 + 흰 글자 (물주기 완료됨)
 * - text:    배경 없이 글자만 (설문 「수정 중」)
 */
export function Chip({
  label,
  tone = 'filled',
  style,
}: {
  label: string;
  tone?: 'filled' | 'outline' | 'text' | 'blue';
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        styles.base,
        tone === 'filled' && styles.filled,
        tone === 'outline' && styles.outline,
        tone === 'text' && styles.text,
        tone === 'blue' && styles.blue,
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          (tone === 'filled' || tone === 'blue') && styles.labelFilled,
          tone === 'outline' && styles.labelOutline,
          tone === 'text' && styles.labelText,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { paddingHorizontal: 10, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  filled: { height: 20, backgroundColor: colors.primary[500] },
  blue: { height: 20, backgroundColor: colors.secondary[400] },
  outline: { height: 22, borderWidth: 1, borderColor: colors.grey[500] },
  text: { paddingHorizontal: 0 },
  label: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 14 },
  labelFilled: { color: colors.grey.white },
  labelOutline: { color: colors.grey[600] },
  labelText: { fontFamily: fonts.semiBold, fontSize: 14, lineHeight: 16, color: colors.primary[500] },
});
