import { ADMIN_PHONE } from './adminContact';

export type AgeGroup = '10대' | '20대' | '30대' | '40대' | '50대' | '60대 이상';

export const AGE_GROUPS: readonly AgeGroup[] = ['10대', '20대', '30대', '40대', '50대', '60대 이상'];

export const FALL_HOURS_MIN = 3;
export const FALL_HOURS_MAX = 48;
export const FALL_HOURS_DEFAULT = 24;

export type Profile = {
  participantId: string;
  name: string;
  ageGroup: AgeGroup | null;
  /** 온보딩에서 적은 FIUM 기기 번호. BLE 이름은 C33_FLOWER_{deviceNumber} */
  deviceNumber: string;
  /** YYYY-MM-DD, 사용 시작일 */
  studyStartDate: string;
  createdAt: string;
};

export function deviceNameFromNumber(n: string): string {
  const num = n.trim().replace(/^0+(?=\d)/, '');
  return `C33_FLOWER_${num || '1'}`;
}

export function clampFallHours(n: number): number {
  if (!Number.isFinite(n)) return FALL_HOURS_DEFAULT;
  return Math.min(FALL_HOURS_MAX, Math.max(FALL_HOURS_MIN, Math.round(n)));
}

export type WaterMark = 'complete' | 'bloom';

/** 물주기 기록. 완료 한 줄, 중간에 만개 확인되면 bloom 한 줄 */
export type WaterEvent = {
  id: string;
  at: string;
  /** YYYY-MM-DD */
  date: string;
  mark: WaterMark;
  /** 그 순간의 로봇 POS */
  pos: number | null;
  /** 물주기 시작 때 로봇 POS */
  posStart: number | null;
  /** 완료하기 뒤 로봇 POS */
  posEnd: number | null;
  /** 0~100. posEnd 기반 */
  wiltPercent: number | null;
  deviceConnected: boolean;
  pourDurationMs: number;
  /** start↔stop 전환 횟수 */
  startStopChanges: number;
  bloomed: boolean;
  /** 당시 설정된 낙화 시간 */
  fallHours: number;
};

export type AppSettings = {
  /** Google Apps Script 웹앱 URL. 비어 있으면 로컬만 저장 */
  sheetUrl: string;
  /** 관리자 연락처 */
  adminPhone: string;
  /** BLE 이름. 보통 프로필의 기기 번호에서 자동 계산되고, 관리자 화면에서 덮어쓸 수 있다 */
  deviceName: string;
  /** 낙화까지 걸리는 시간. 3~48, 기본 24 */
  fallHours: number;
};

export type SheetRow = {
  kind: 'water' | 'session';
  participantId: string;
  name: string;
  ageGroup?: string | null;
  deviceNumber?: string | null;
  date: string;
  time: string;
  payload: Record<string, string | number | boolean | null>;
};

export type QueuedRow = {
  id: string;
  row: SheetRow;
  attempts: number;
  createdAt: string;
};

export type AppState = {
  profile: Profile | null;
  waterEvents: WaterEvent[];
  settings: AppSettings;
  queue: QueuedRow[];
};

export const DEFAULT_SETTINGS: AppSettings = {
  sheetUrl: 'https://script.google.com/macros/s/AKfycbzWXTFKcmqmDAQaqQ1hth1SNDeWYH18SfuaT2QS68TX4xron36Q5NnK9kFbY29-j9As/exec',
  adminPhone: ADMIN_PHONE,
  deviceName: 'C33_FLOWER_1',
  fallHours: FALL_HOURS_DEFAULT,
};

export const INITIAL_STATE: AppState = {
  profile: null,
  waterEvents: [],
  settings: DEFAULT_SETTINGS,
  queue: [],
};
