import { ReactNode } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';

type CardProps = {
  kicker?: string;
  children?: ReactNode;
  style?: ViewStyle;
  tone?: 'default' | 'soft' | 'warn';
};

export function Card({ kicker, children, style, tone = 'default' }: CardProps) {
  return (
    <View style={[styles.card, tone === 'soft' && styles.soft, tone === 'warn' && styles.warn, style]}>
      {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  soft: { backgroundColor: colors.yellow[50], borderColor: colors.yellow[200] },
  warn: { backgroundColor: '#FBF4EC', borderColor: '#E9D2B5' },
  kicker: { fontSize: 12, color: colors.textMuted, marginBottom: 6 },
});
