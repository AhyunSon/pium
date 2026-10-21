import type { AppState } from './types';

function cell(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function line(values: unknown[]): string {
  return values.map(cell).join(',');
}

/** 참가자 1명의 전체 기록을 CSV 한 장으로 */
export function buildCsv(state: AppState): string {
  const p = state.profile;
  const rows: string[] = [];

  rows.push(line(['section', 'participantId', 'name', 'ageGroup', 'deviceNumber', 'studyStartDate', 'fallHours']));
  rows.push(
    line([
      'profile',
      p?.participantId,
      p?.name,
      p?.ageGroup,
      p?.deviceNumber,
      p?.studyStartDate,
      state.settings.fallHours,
    ]),
  );
  rows.push('');

  rows.push(
    line(['section', 'id', 'date', 'time', 'mark', 'pos', 'posStart', 'posEnd', 'wiltPercent', 'deviceConnected', 'pourDurationMs', 'startStopChanges', 'bloomed']),
  );
  for (const w of [...state.waterEvents].sort((a, b) => a.at.localeCompare(b.at))) {
    rows.push(
      line([
        'water',
        w.id,
        w.date,
        w.at.slice(11, 19),
        w.mark,
        w.pos,
        w.posStart,
        w.posEnd,
        w.wiltPercent,
        w.deviceConnected,
        w.pourDurationMs,
        w.startStopChanges,
        w.bloomed,
      ]),
    );
  }

  return '\uFEFF' + rows.join('\n');
}
