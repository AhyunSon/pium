/** Portenta C33 펌웨어와 맞춘 값. 펌웨어를 바꾸면 여기만 같이 바꿉니다. */
export const FLOWER_SERVICE_UUID = '60000000-0000-0000-0000-000000000001';
export const FLOWER_STATUS_UUID = '60000000-0000-0000-0000-000000000002';
export const FLOWER_COMMAND_UUID = '60000000-0000-0000-0000-000000000003';

export const DEFAULT_DEVICE_NAME = 'C33_FLOWER_1';

/** 꽃 위치. 0 = 완전히 핀 상태(HOME), 9600 = 완전히 시든 상태 */
export const FLOWER_MIN_POSITION = 0;
export const FLOWER_MAX_POSITION = 9600;

/** 펌웨어가 500ms마다 상태를 보냅니다. 이 시간 넘게 조용하면 끊긴 것으로 봅니다. */
export const STATUS_STALE_MS = 4000;

export const SCAN_TIMEOUT_MS = 12000;

export type FlowerCommand =
  | 'RESET'
  | 'TEST'
  | 'WATER_START'
  | 'WATER_STOP'
  | 'GETTIME'
  | `SETTIME:${number}`
  | `SETPOS:${number}`
  | `MOVEPOS:${number}`;

/** 꽃 9600→0 이 20초. 명령·모터 지연보다 물이 먼저 안 끝나게 3초 여유 */
export const FULL_POUR_MS = 23000;
/** 꽃이 다 핀 뒤 남은 물. 0→100이 이 시간이면 남은 양만 더 빨리 빠짐 */
export const BLOOMED_POUR_MS = 8000;

export function wiltPercentFromPos(pos: number): number {
  const clamped = Math.max(FLOWER_MIN_POSITION, Math.min(FLOWER_MAX_POSITION, pos));
  return Math.round((clamped / FLOWER_MAX_POSITION) * 100);
}
