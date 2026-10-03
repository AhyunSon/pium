import { TextStyle } from 'react-native';

/**
 * Pretendard 패밀리. useFonts로 로드하는 이름과 일치해야 한다 (app/_layout.tsx).
 * 안드로이드는 fontWeight로 굵기를 고르지 못하므로 굵기별 패밀리 이름을 직접 쓴다.
 */
export const fonts = {
  regular: 'Pretendard-Regular',
  medium: 'Pretendard-Medium',
  semiBold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
  extraBold: 'Pretendard-ExtraBold',
} as const;

export const fontAssets = {
  [fonts.regular]: require('../../assets/fonts/Pretendard-Regular.otf'),
  [fonts.medium]: require('../../assets/fonts/Pretendard-Medium.otf'),
  [fonts.semiBold]: require('../../assets/fonts/Pretendard-SemiBold.otf'),
  [fonts.bold]: require('../../assets/fonts/Pretendard-Bold.otf'),
  [fonts.extraBold]: require('../../assets/fonts/Pretendard-ExtraBold.otf'),
};

/** 피그마 텍스트 스타일. 이름은 피그마와 같다. */
export const type = {
  /** 2. Heading — Bold 24 */
  heading: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 30 },
  /** 2-1. Heading_Light — Regular 24 */
  headingLight: { fontFamily: fonts.regular, fontSize: 24, lineHeight: 30 },
  /** 3. Title — SemiBold 20 / 28 */
  title: { fontFamily: fonts.semiBold, fontSize: 20, lineHeight: 28 },
  /** 3-1. Title — Medium 20 / 28 */
  titleMedium: { fontFamily: fonts.medium, fontSize: 20, lineHeight: 28 },
  /** 4. Sub Title — SemiBold 18 / 26 */
  subTitle: { fontFamily: fonts.semiBold, fontSize: 18, lineHeight: 26 },
  /** 5. Body Large — Medium 16 / 21 */
  bodyLarge: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 21 },
  /** 6. Body Small — Regular 14 / 18 */
  bodySmall: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 18 },
  /** 7. Label — SemiBold 14 / 16 */
  label: { fontFamily: fonts.semiBold, fontSize: 14, lineHeight: 16 },
  /** 8. Caption — Regular 12 */
  caption: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 15 },
  /** Water Percent — ExtraBold 100, letterSpacing -3 */
  waterPercent: { fontFamily: fonts.extraBold, fontSize: 100, lineHeight: 100, letterSpacing: -3 },
} satisfies Record<string, TextStyle>;
