import { ADMIN_PHONE } from './adminContact';

export type AgeGroup = '10대' | '20대' | '30대' | '40대' | '50대' | '60대 이상';

export const AGE_GROUPS: readonly AgeGroup[] = ['10대', '20대', '30대', '40대', '50대', '60대 이상'];

/** 실험 기간 (일) */
export const STUDY_DAYS = 4;

export type Profile = {
  participantId: string;
  name: string;
  ageGroup: AgeGroup | null;
  habit: string;
  /** 온보딩에서 적은 FIUM 기기 번호. BLE 이름은 C33_FLOWER_{deviceNumber} */
  deviceNumber: string;
  /** YYYY-MM-DD, 실험 1일차 */
  studyStartDate: string;
  createdAt: string;
};

export function deviceNameFromNumber(n: string): string {
  const num = n.trim().replace(/^0+(?=\d)/, '');
  return `C33_FLOWER_${num || '1'}`;
}

/** 물주기 1회 = RESET 1회 */
export type WaterEvent = {
  id: string;
  at: string;
  /** YYYY-MM-DD */
  date: string;
  /** 로봇이 보낸 WATER_POS (0~9600). 미연결이면 null */
  wiltPos: number | null;
  /** 0~100. wiltPos 기반 */
  wiltPercent: number | null;
  deviceConnected: boolean;
  pourDurationMs: number;
};

// ── 다이어리 설문 (8문항) ───────────────────────────────────────────
export type YesNo = 'yes' | 'no';
/** Q3. 떠올랐을 때 꽃잎 상태 1(활짝)~5(많이 시듦) 또는 기억나지 않음 */
export type PetalScale = 1 | 2 | 3 | 4 | 5 | 'unknown';
export type Influence = 'pium' | 'routine' | 'alarm' | 'others' | 'self' | 'other';
export type Reason = 'forgot' | 'noTime' | 'schedule' | 'hard' | 'tired' | 'unnecessary' | 'other';
export type Delay = 'immediately' | 'later';

export const INFLUENCE_LABELS: Record<Influence, string> = {
  pium: 'Pium을 봄',
  routine: '원래 하던 시간/일과',
  alarm: '알람 또는 휴대폰',
  others: '다른 사람/상황',
  self: '스스로 생각남',
  other: '기타:',
};

export const REASON_LABELS: Record<Reason, string> = {
  forgot: '목표 행동을 잊어버려서',
  noTime: '시간이 부족해서',
  schedule: '다른 일정이나 해야 할 일이 있어서',
  hard: '목표 행동을 하기 어려운 상황이어서',
  tired: '피곤하거나 의욕이 없어서',
  unnecessary: '오늘은 목표 행동을 할 필요가 없다고 생각해서',
  other: '기타:',
};

export const DELAY_LABELS: Record<Delay, string> = {
  immediately: '바로 시작했다',
  later: '나중에 시작했다',
};

export type SurveyAnswers = {
  q1_noticedPetal: YesNo | null;
  q2_recalledHabit: YesNo | null;
  q3_petalStateWhenRecalled: PetalScale | null;
  q4_didHabit: YesNo | null;
  /** Q4=예 일 때. 다중 선택 */
  q5_influences: Influence[];
  /** Q4=아니오 일 때. 단일 선택이지만 배열로 통일 */
  q5_reasons: Reason[];
  q5_otherText: string;
  q6_startDelay: Delay | null;
  q7_waterDelay: Delay | null;
  q8_freeText: string;
};

export const EMPTY_SURVEY: SurveyAnswers = {
  q1_noticedPetal: null,
  q2_recalledHabit: null,
  q3_petalStateWhenRecalled: null,
  q4_didHabit: null,
  q5_influences: [],
  q5_reasons: [],
  q5_otherText: '',
  q6_startDelay: null,
  q7_waterDelay: null,
  q8_freeText: '',
};

export type DiaryEntry = SurveyAnswers & {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  /** 실험 n일차 (1~4) */
  day: number;
  createdAt: string;
  updatedAt: string;
};

export type AppSettings = {
  /** Google Apps Script 웹앱 URL. 비어 있으면 로컬만 저장 */
  sheetUrl: string;
  /** 관리자 연락처 */
  adminPhone: string;
  /** BLE 이름. 보통 프로필의 기기 번호에서 자동 계산되고, 관리자 화면에서 덮어쓸 수 있다 */
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
  sheetUrl: 'https://script.google.com/macros/s/AKfycbzWXTFKcmqmDAQaqQ1hth1SNDeWYH18SfuaT2QS68TX4xron36Q5NnK9kFbY29-j9As/exec',
  adminPhone: ADMIN_PHONE,
  deviceName: 'C33_FLOWER_1',
};

export const INITIAL_STATE: AppState = {
  profile: null,
  waterEvents: [],
  diary: [],
  settings: DEFAULT_SETTINGS,
  queue: [],
};
