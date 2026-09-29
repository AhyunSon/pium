const pad = (n: number) => String(n).padStart(2, '0');

export function toDateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function toTimeKey(d: Date = new Date()): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, days: number): string {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

/** 실험 n일차 (1~4). 범위 밖이면 null */
export function studyDay(startDate: string, dateKey: string, length = 4): number | null {
  const diff = Math.round(
    (parseDateKey(dateKey).getTime() - parseDateKey(startDate).getTime()) / 86400000,
  );
  if (diff < 0 || diff >= length) return null;
  return diff + 1;
}

export function formatKoreanDate(key: string): string {
  const d = parseDateKey(key);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
}

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
