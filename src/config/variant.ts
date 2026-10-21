import Constants from 'expo-constants';

export type AppVariant = 'study' | 'workshop';

export const APP_VARIANT: AppVariant =
  Constants.expoConfig?.extra?.appVariant === 'workshop' ? 'workshop' : 'study';

export const IS_WORKSHOP = APP_VARIANT === 'workshop';
