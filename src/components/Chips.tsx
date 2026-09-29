import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

type ChipsProps<T extends string> = {
  options: readonly T[];
  value: T | null;
  onChange: (value: T) => void;
};

export function Chips<T extends string>({ options, value, onChange }: ChipsProps<T>) {
  return (
    <View style={styles.row}>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={({ pressed }) => [
              styles.chip,
              active && styles.chipActive,
              pressed && !active && styles.chipPressed,
            ]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.yellow[50], borderColor: colors.yellow[300] },
  chipPressed: { backgroundColor: colors.gray[50] },
  label: { fontSize: 14, color: colors.text },
  labelActive: { color: colors.yellow[700], fontWeight: '600' },
});
