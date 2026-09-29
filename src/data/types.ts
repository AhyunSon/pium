export type Gender = '여성' | '남성' | '기타' | '응답 안 함';

export type AgeGroup = '10대' | '20대' | '30대' | '40대' | '50대' | '60대 이상';

export type Profile = {
  participantId: string;
  name: string;
  gender: Gender | null;
  ageGroup: AgeGroup | null;
  habit: string;
  /** YYYY-MM-DD, 실험 1일차 */
  studyStartDate: string;
  createdAt: string;
};

/** 물주기 1회 = RESET 1회 */
export type WaterEvent = {
  id: string;
  at: string;
  /** YYYY-MM-DD */
  date: string;
  /** 로봇이 보낸 WATER_POS (0~9600). 미연결이면 null */
  wiltPos: number | null;
  /** 0~100. wiltPos 기반, 없으면 사용자가 다이어리에서 적음 */
  wiltPercent: number | null;
  deviceConnected: boolean;
  pourDurationMs: number;
};

export type Trigger = '스스로 기억' | '화분을 보고' | '정해진 시간' | '다른 사람' | '기타';

export type DiaryEntry = {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  didHabit: boolean | null;
  /** HH:mm */
  startTime: string | null;
  trigger: Trigger | null;
  triggerNote: string;
  /** 0~100, 물을 줄 때 꽃의 시든 정도 */
  wiltAtWater: number | null;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type AppSettings = {
  /** Google Apps Script 웹앱 URL. 비어 있으면 로컬만 저장 */
  sheetUrl: string;
  /** 관리자 연락처 */
  adminPhone: string;
  deviceName: string;
};

export type SheetRow = {
  kind: 'water' | 'diary' | 'session';
  participantId: string;
  name: string;
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
  diary: DiaryEntry[];
  settings: AppSettings;
  queue: QueuedRow[];
};

export const DEFAULT_SETTINGS: AppSettings = {
  sheetUrl: '',
  adminPhone: '',
  deviceName: 'C33_FLOWER_1',
};

export const INITIAL_STATE: AppState = {
  profile: null,
  waterEvents: [],
  diary: [],
  settings: DEFAULT_SETTINGS,
  queue: [],
};
