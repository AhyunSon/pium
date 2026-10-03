import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { CheckOffIcon, CheckOnIcon } from '../theme/icons';
import { fonts, type } from '../theme/typography';
import { Button } from './Button';
import { UnderlineInput } from './Field';
import type { PetalScale, YesNo } from '../data/types';

export function SurveyProgress({ current }: { current: 1 | 2 | 3 }) {
  return (
    <View style={styles.progress}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={[styles.bar, i <= current ? styles.barOn : styles.barOff]} />
      ))}
    </View>
  );
}

export function SurveyQuestion({ number, children }: { number: string; children: React.ReactNode }) {
  return (
    <View style={styles.q}>
      <Text style={styles.qNum}>{number}</Text>
      <Text style={styles.qText}>{children}</Text>
    </View>
  );
}

export function YesNoRow({
  value,
  onChange,
  disabled,
}: {
  value: YesNo | null;
  onChange: (v: YesNo) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.yesNo}>
      <Button label="예" variant="choice" selected={value === 'yes'} disabled={disabled} onPress={() => onChange('yes')} />
      <Button label="아니오" variant="choice" selected={value === 'no'} disabled={disabled} onPress={() => onChange('no')} />
    </View>
  );
}

export function CheckRow({
  label,
  selected,
  onPress,
  disabled,
  align = 'left',
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  align?: 'left' | 'center';
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.checkRow, align === 'center' && styles.checkRowCenter]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
    >
      {selected ? <CheckOnIcon width={24} height={24} /> : <CheckOffIcon width={24} height={24} />}
      <Text style={[styles.checkLabel, selected && styles.checkLabelOn, align === 'center' && styles.checkLabelCenter]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function CheckGroup<T extends string>({
  options,
  value,
  onChange,
  multiple,
  disabled,
  otherText,
  onOtherText,
  textKey,
  textPlaceholder = '내용을 입력해주세요.',
}: {
  options: { key: T; label: string }[];
  value: T[];
  onChange: (next: T[]) => void;
  multiple?: boolean;
  disabled?: boolean;
  otherText?: string;
  onOtherText?: (t: string) => void;
  textKey?: T;
  textPlaceholder?: string;
}) {
  const expandKey = textKey ?? ('other' as T);
  const toggle = (key: T) => {
    if (disabled) return;
    if (multiple) {
      onChange(value.includes(key) ? value.filter((k) => k !== key) : [...value, key]);
    } else {
      onChange(value[0] === key ? [] : [key]);
    }
  };

  return (
    <View style={styles.box}>
      {options.map((o) => (
        <View key={o.key} style={styles.optWrap}>
          <CheckRow label={o.label} selected={value.includes(o.key)} onPress={() => toggle(o.key)} disabled={disabled} />
          {o.key === expandKey && value.includes(o.key) ? (
            <View style={styles.other}>
              <UnderlineInput
                value={otherText ?? ''}
                onChangeText={onOtherText}
                placeholder={textPlaceholder}
                editable={!disabled}
              />
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

export function PetalScalePicker({
  value,
  onChange,
  disabled,
}: {
  value: PetalScale | null;
  onChange: (v: PetalScale) => void;
  disabled?: boolean;
}) {
  const selected = value === 'unknown' ? null : value;
  return (
    <View style={styles.box}>
      <View style={styles.scaleRow}>
        <Image source={require('../../assets/images/survey-flower-bloomed.png')} style={styles.bloomed} resizeMode="contain" />
        <View style={styles.nums}>
          {([1, 2, 3, 4, 5] as const).map((n) => {
            const on = selected === n;
            return (
              <Pressable
                key={n}
                disabled={disabled}
                onPress={() => onChange(n)}
                style={[styles.num, on && styles.numOn]}
              >
                <Text style={[styles.numText, on && styles.numTextOn]}>{n}</Text>
              </Pressable>
            );
          })}
        </View>
        <Image source={require('../../assets/images/survey-flower-dropped.png')} style={styles.dropped} resizeMode="contain" />
      </View>
      <CheckRow
        label="기억나지 않음"
        selected={value === 'unknown'}
        disabled={disabled}
        align="center"
        onPress={() => onChange('unknown')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  progress: { flexDirection: 'row', width: '100%', height: 4, gap: 0 },
  bar: { flex: 1, height: 4 },
  barOn: { backgroundColor: colors.primary[700] },
  barOff: { backgroundColor: colors.grey[200] },
  q: { gap: 6, width: '100%' },
  qNum: { ...type.bodyLarge, color: colors.primary[500] },
  qText: { ...type.titleMedium, color: colors.primary[700] },
  yesNo: { flexDirection: 'row', gap: 16, width: '100%' },
  box: {
    width: '100%',
    backgroundColor: colors.grey.white,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 28,
    gap: 20,
    alignItems: 'center',
  },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, width: '100%' },
  checkRowCenter: { justifyContent: 'center', alignItems: 'center' },
  checkLabel: { ...type.bodyLarge, color: colors.grey[400], flex: 1 },
  checkLabelOn: { color: colors.primary[700] },
  checkLabelCenter: { flex: 0 },
  optWrap: { width: '100%', gap: 9 },
  other: { paddingLeft: 32, width: '100%' },
  scaleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', paddingRight: 12 },
  bloomed: { width: 71, height: 73 },
  dropped: { width: 41, height: 73 },
  nums: { flex: 1, minWidth: 182, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  num: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.grey.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numOn: { backgroundColor: colors.primary[100] },
  numText: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 21, color: colors.grey[300] },
  numTextOn: { color: colors.primary[700] },
});
