import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  small?: boolean;
};

export function Button({ label, onPress, variant = 'primary', disabled, loading, style, small }: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        small && styles.small,
        variants[variant].wrap,
        pressed && variants[variant].pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variants[variant].label.color} />
      ) : (
        <Text style={[styles.label, small && styles.smallLabel, variants[variant].label]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  small: { paddingVertical: 10, paddingHorizontal: 14, minHeight: 40, borderRadius: 10 },
  label: { fontSize: 16, fontWeight: '600' },
  smallLabel: { fontSize: 14 },
  disabled: { opacity: 0.45 },
});

const variants: Record<Variant, { wrap: ViewStyle; pressed: ViewStyle; label: { color: string } }> = {
  primary: {
    wrap: { backgroundColor: colors.accent },
    pressed: { backgroundColor: colors.accentPressed },
    label: { color: colors.yellow[700] },
  },
  secondary: {
    wrap: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    pressed: { backgroundColor: colors.gray[50] },
    label: { color: colors.text },
  },
  ghost: {
    wrap: { backgroundColor: 'transparent' },
    pressed: { backgroundColor: colors.gray[100] },
    label: { color: colors.textMuted },
  },
  danger: {
    wrap: { backgroundColor: colors.surface, borderWidth: 1, borderColor: '#E0B4B4' },
    pressed: { backgroundColor: '#FBECEC' },
    label: { color: '#9A3B3B' },
  },
};
