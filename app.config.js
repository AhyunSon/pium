/**
 * 스터디 앱과 workshop 앱을 한 기기에서 같이 쓰도록 나눕니다.
 * APP_VARIANT=workshop 이면 표시 이름은 「피움 FIUM」, 패키지는 com.pium.workshop.
 * 스터디 앱(com.pium.app)은 덮이지 않습니다.
 */
const IS_WORKSHOP = process.env.APP_VARIANT === 'workshop';

function appName() {
  return IS_WORKSHOP ? '피움 FIUM' : 'FIUM 피움';
}

function uniqueId() {
  return IS_WORKSHOP ? 'com.pium.workshop' : 'com.pium.app';
}

module.exports = ({ config }) => ({
  ...config,
  name: appName(),
  scheme: IS_WORKSHOP ? 'pium-workshop' : config.scheme,
  ios: {
    ...config.ios,
    bundleIdentifier: uniqueId(),
  },
  android: {
    ...config.android,
    package: uniqueId(),
  },
  extra: {
    ...config.extra,
    appVariant: IS_WORKSHOP ? 'workshop' : 'study',
  },
});
