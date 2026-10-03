import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { WarnIcon } from '../theme/icons';
import { fonts } from '../theme/typography';

export function Snackbar({
  message,
  onHide,
  duration = 3200,
}: {
  message: string | null;
  onHide: () => void;
  duration?: number;
}) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onHide, duration);
    return () => clearTimeout(t);
  }, [message, duration, onHide]);

  if (!message) return null;

  return (
    <View pointerEvents="none" style={styles.wrap}>
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
    bottom: 16,
    zIndex: 10,
  },
  bar: {
    backgroundColor: colors.primary[700],
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.grey.white,
    textAlign: 'center',
  },
});
