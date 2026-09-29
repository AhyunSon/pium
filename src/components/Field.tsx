import { ReactNode } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors } from '../theme/colors';

type FieldProps = {
  label: string;
  children?: ReactNode;
  helper?: string;
};

export function Field({ label, children, helper }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  );
}

export function Input(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.gray[200]}
      {...props}
      style={[styles.input, props.multiline && styles.multiline, props.style]}
    />
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 20 },
  label: { fontSize: 13, color: colors.textMuted, marginBottom: 8 },
  helper: { fontSize: 12, color: colors.gray[300], marginTop: 6 },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  multiline: { minHeight: 110, textAlignVertical: 'top' },
});
