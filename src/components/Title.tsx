import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { type } from '../theme/typography';

/** 피그마 Title: 20 SemiBold + (선택) 16 Medium 부제, 간격 4 */
export function Title({
  title,
  subtitle,
  align = 'left',
  subtitleColor = colors.primary[500],
  color = colors.primary[700],
  style,
}: {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  subtitleColor?: string;
  color?: string;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.wrap, style]}>
      <Text style={[styles.title, { color, textAlign: align }]}>{title}</Text>
      {subtitle ? <Text style={[styles.sub, { color: subtitleColor, textAlign: align }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4, width: '100%' },
  title: { ...type.title },
  sub: { ...type.bodyLarge },
});
