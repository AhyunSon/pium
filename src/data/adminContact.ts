import { Platform } from 'react-native';

/** 공식 관리자. 전화·문자의 기본 수신. */
export const ADMIN_PHONE = '010-7778-6389';
/** 문자만 같이 받는 관리자 */
export const ADMIN_SMS_SHARE = '010-2896-9092';

export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function adminCallUrl(): string {
  return `tel:${phoneDigits(ADMIN_PHONE)}`;
}

/** 두 관리자에게 같은 본문으로 문자창을 연다. 사용자가 한 번 보내면 둘 다 받는다. */
export function adminSmsUrl(body: string): string {
  const encoded = encodeURIComponent(body);
  const primary = phoneDigits(ADMIN_PHONE);
  const share = phoneDigits(ADMIN_SMS_SHARE);
  if (Platform.OS === 'ios') {
    return `sms:/open?addresses=${primary},${share}&body=${encoded}`;
  }
  return `sms:${primary},${share}?body=${encoded}`;
}
