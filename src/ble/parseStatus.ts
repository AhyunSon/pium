/**
 * 펌웨어 statusCharacteristic 문자열을 해석합니다.
 *
 * 주기 상태:  "STOP POS:1234 SW:0", "FWD POS:...", "HOME POS:...", "FAULT POS:..."
 * 이벤트:    "WATER_POS:1234", "HOME OK POS:0", "HOME SETTLE POS:12", "MOVE OK:500",
 *            "FAULT LIMIT POS:-31", "FAULT ACTIVE", "SET POS:100", "SET ERROR", "MOVE ERROR",
 *            "TEST_FWD POS:0", "ADJ S:.. T:..", "ADJ CANCEL POS:.. SW:0", "HOME STOP POS:.."
 */
export type FlowerMotorState =
  | 'STOP'
  | 'FWD'
  | 'HOME'
  | 'TEST_FWD'
  | 'TEST_HOME'
  | 'MOVE_FWD'
  | 'MOVE_REV'
  | 'HOME_ADJ'
  | 'HOME_SETTLE'
  | 'FAULT'
  | 'UNKNOWN';

export type FlowerStatus = {
  raw: string;
  motor: FlowerMotorState;
  pos: number | null;
  homeSwitch: boolean | null;
  /** RESET 직후 한 번 옵니다 */
  waterPos: number | null;
  homeOk: boolean;
  fault: string | null;
  error: string | null;
};

const PERIODIC: FlowerMotorState[] = [
  'STOP',
  'FWD',
  'HOME',
  'TEST_FWD',
  'TEST_HOME',
  'MOVE_FWD',
  'MOVE_REV',
  'HOME_ADJ',
  'HOME_SETTLE',
  'FAULT',
];

function num(match: RegExpMatchArray | null): number | null {
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : null;
}

export function parseStatus(raw: string): FlowerStatus {
  const text = raw.trim();
  const status: FlowerStatus = {
    raw: text,
    motor: 'UNKNOWN',
    pos: num(text.match(/POS:(-?\d+)/)),
    homeSwitch: null,
    waterPos: null,
    homeOk: false,
    fault: null,
    error: null,
  };

  const sw = text.match(/SW:(\d)/);
  if (sw) status.homeSwitch = sw[1] === '1';

  const water = text.match(/^WATER_POS:(-?\d+)/);
  if (water) {
    status.waterPos = Number(water[1]);
    status.pos = status.waterPos;
    return status;
  }

  if (text.startsWith('HOME OK')) {
    status.homeOk = true;
    status.motor = 'STOP';
    return status;
  }

  if (text.startsWith('HOME SETTLE')) {
    status.motor = 'HOME_SETTLE';
    return status;
  }

  if (text.startsWith('HOME STOP')) {
    status.motor = 'STOP';
    return status;
  }

  if (text.startsWith('MOVE OK')) {
    status.motor = 'STOP';
    status.pos = num(text.match(/MOVE OK:(-?\d+)/));
    return status;
  }

  if (text.startsWith('SET POS')) {
    status.motor = 'STOP';
    return status;
  }

  if (text === 'SET ERROR' || text === 'MOVE ERROR' || text === 'FAULT ACTIVE') {
    status.error = text;
    if (text === 'FAULT ACTIVE') status.motor = 'FAULT';
    return status;
  }

  if (text.startsWith('FAULT')) {
    status.motor = 'FAULT';
    const reason = text.match(/^FAULT\s+([A-Z_]+)/);
    status.fault = reason ? reason[1] : 'FAULT';
    return status;
  }

  if (text.startsWith('ADJ')) {
    status.motor = 'HOME_ADJ';
    return status;
  }

  const head = text.split(' ')[0] as FlowerMotorState;
  if (PERIODIC.includes(head)) status.motor = head;
  return status;
}
