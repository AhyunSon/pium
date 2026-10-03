import { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { DropdownIcon } from '../theme/icons';
import { type } from '../theme/typography';
import { useScrollIntoView } from './Screen';

/** 피그마 Input with Label: 라벨 14 SemiBold + 4 간격 + 인풋 */
type FieldProps = {
  label: string;
  children?: React.ReactNode;
  helper?: string;
  style?: ViewStyle;
};

export function Field({ label, children, helper, style }: FieldProps) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  );
}

/** 피그마 Input: h56 r8 grey300 테두리, 좌우 16, Body Large */
export function Input(props: TextInputProps) {
  const ref = useRef<TextInput>(null);
  const scrollIntoView = useScrollIntoView();
  return (
    <TextInput
      placeholderTextColor={colors.grey[200]}
      {...props}
      ref={ref}
      onFocus={(e) => {
        props.onFocus?.(e);
        if (ref.current) scrollIntoView(ref.current);
      }}
      style={[styles.input, props.multiline && styles.multiline, props.style]}
    />
  );
}

/** 밑줄만 있는 인풋 (설문 "기타:" 입력) */
export function UnderlineInput(props: TextInputProps) {
  const ref = useRef<TextInput>(null);
  const scrollIntoView = useScrollIntoView();
  return (
    <TextInput
      placeholderTextColor="#ADADAD"
      {...props}
      ref={ref}
      onFocus={(e) => {
        props.onFocus?.(e);
        if (ref.current) scrollIntoView(ref.current);
      }}
      style={[styles.underline, props.style]}
    />
  );
}

type DropdownProps<T extends string> = {
  value: T | null;
  options: readonly T[];
  placeholder: string;
  onChange: (v: T) => void;
  disabled?: boolean;
};

/** 피그마 Input(Property=Dropdown). 누르면 가운데 시트가 떠서 고른다. */
export function Dropdown<T extends string>({ value, options, placeholder, onChange, disabled }: DropdownProps<T>) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        style={({ pressed }) => [styles.input, styles.dropdown, pressed && styles.pressed]}
        accessibilityRole="button"
      >
        <Text style={[styles.dropdownText, !value && styles.placeholder]}>{value ?? placeholder}</Text>
        <DropdownIcon width={16} height={16} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            {options.map((o) => (
              <Pressable
                key={o}
                onPress={() => {
                  onChange(o);
                  setOpen(false);
                }}
                style={({ pressed }) => [styles.option, (pressed || o === value) && styles.optionOn]}
              >
                <Text style={[styles.optionText, o === value && styles.optionTextOn]}>{o}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: { gap: 4 },
  label: { ...type.label, color: colors.primary[700] },
  helper: { ...type.caption, color: colors.grey[400], marginTop: 2 },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: colors.grey[300],
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
    ...type.bodyLarge,
    color: colors.primary[700],
    backgroundColor: 'transparent',
  },
  multiline: { height: undefined, minHeight: 120, paddingVertical: 14, textAlignVertical: 'top' },
  underline: {
    ...type.bodyLarge,
    color: colors.primary[700],
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey[300],
  },
  dropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pressed: { backgroundColor: colors.primary.base },
  dropdownText: { ...type.bodyLarge, color: colors.primary[700] },
  placeholder: { color: colors.grey[200] },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(33,33,14,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  sheet: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.grey.white,
    borderRadius: 12,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  option: { height: 52, paddingHorizontal: 20, justifyContent: 'center' },
  optionOn: { backgroundColor: colors.primary.base },
  optionText: { ...type.bodyLarge, color: colors.grey[500] },
  optionTextOn: { color: colors.primary[700], fontFamily: type.label.fontFamily },
});
