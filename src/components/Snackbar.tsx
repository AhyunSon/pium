import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { WarnIcon } from '../theme/icons';
import { fonts } from '../theme/typography';

export function Snackbar({
  message,
  onHide,
  duration = 3200,
  placement = 'bottom',
}: {
  message: string | null;
  onHide: () => void;
  duration?: number;
  placement?: 'top' | 'bottom';
}) {
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onHide, duration);
    return () => clearTimeout(t);
  }, [message, duration, onHide]);

  if (!message) return null;

  return (
    <View
      pointerEvents="none"
      style={[styles.wrap, placement === 'top' ? { top: insets.top + 56 + 8 } : styles.bottom]}
    >
      <View style={styles.bar}>
        <View style={styles.row}>
          <WarnIcon width={18} height={18} />
          <Text style={styles.text}>{message}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 10,
  },
  bottom: { bottom: 16 },
  bar: {
    backgroundColor: colors.primary[700],
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    flexShrink: 1,
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.grey.white,
    textAlign: 'left',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
