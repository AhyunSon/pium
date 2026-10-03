import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { BackIcon, BackWhiteIcon, CloseIcon, LogoIcon } from '../theme/icons';
import { type } from '../theme/typography';

/**
 * 피그마 Nav/Top Nav. 높이 56, 위 4 패딩, 좌우 20.
 * - Home:   로고 + 오른쪽 "DAY 02 / 04"
 * - Back:   뒤로가기 아이콘
 * - Close:  닫기 아이콘
 * - Survey: 뒤로가기 + 가운데 "01 / 03" + 오른쪽 슬롯(수정/저장 버튼)
 * - Hide:   아무것도 없음(높이만 유지)
 */
export type TopNavProps = {
  left?: 'back' | 'close' | 'logo' | 'none';
  onLeft?: () => void;
  /** 가운데 글자 (설문 "01 / 03") */
  center?: string;
  /** 오른쪽 글자 (홈 "DAY 02 / 04") */
  rightText?: string;
  right?: ReactNode;
  /** 어두운 배경(물주기)에서 아이콘을 밝게 */
  light?: boolean;
};

export const TOP_NAV_HEIGHT = 56;

export function TopNav({ left = 'none', onLeft, center, rightText, right, light }: TopNavProps) {
  const leftNode = (() => {
    switch (left) {
      case 'back':
        return (
          <Pressable onPress={onLeft} hitSlop={12} style={styles.iconBtn} accessibilityLabel="뒤로">
            {light ? <BackWhiteIcon width={24} height={24} /> : <BackIcon width={24} height={24} />}
          </Pressable>
        );
      case 'close':
        return (
          <Pressable onPress={onLeft} hitSlop={12} style={styles.iconBtn} accessibilityLabel="닫기">
            <CloseIcon width={24} height={24} />
          </Pressable>
        );
      case 'logo':
        return <LogoIcon width={90} height={20} />;
      default:
        return <View style={styles.iconBtn} />;
    }
  })();

  const rightNode = right ? right : rightText ? <Text style={styles.rightText}>{rightText}</Text> : <View style={styles.iconBtn} />;

  return (
    <View style={styles.wrap}>
      <View style={styles.side}>{leftNode}</View>
      {center ? (
        <View style={styles.centerSlot} pointerEvents="none">
          <Text style={styles.center}>{center}</Text>
        </View>
      ) : null}
      <View style={[styles.side, styles.sideEnd]}>{rightNode}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: TOP_NAV_HEIGHT,
    paddingTop: 4,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  side: { zIndex: 1, justifyContent: 'center', flexGrow: 0, flexShrink: 0 },
  sideEnd: { alignItems: 'flex-end' },
  iconBtn: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  centerSlot: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: { ...type.label, color: colors.grey[400] },
  rightText: { ...type.label, color: colors.grey[700] },
});
