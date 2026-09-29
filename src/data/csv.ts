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

  rows.push(line(['section', 'participantId', 'name', 'gender', 'ageGroup', 'habit', 'studyStartDate']));
  rows.push(
    line([
      'profile',
      p?.participantId,
      p?.name,
      p?.gender,
      p?.ageGroup,
      p?.habit,
      p?.studyStartDate,
    ]),
  );
  rows.push('');

  rows.push(
    line(['section', 'id', 'date', 'time', 'wiltPos', 'wiltPercent', 'deviceConnected', 'pourDurationMs']),
  );
  for (const w of [...state.waterEvents].sort((a, b) => a.at.localeCompare(b.at))) {
    rows.push(
      line([
        'water',
        w.id,
        w.date,
        w.at.slice(11, 19),
        w.wiltPos,
        w.wiltPercent,
        w.deviceConnected,
        w.pourDurationMs,
      ]),
    );
  }
  rows.push('');

  rows.push(
    line([
      'section',
      'id',
      'date',
      'didHabit',
      'startTime',
      'trigger',
      'triggerNote',
      'wiltAtWater',
      'note',
      'updatedAt',
    ]),
  );
  for (const d of [...state.diary].sort((a, b) => a.date.localeCompare(b.date))) {
    rows.push(
      line([
        'diary',
        d.id,
        d.date,
        d.didHabit,
        d.startTime,
        d.trigger,
        d.triggerNote,
        d.wiltAtWater,
        d.note,
        d.updatedAt,
      ]),
    );
  }

  return '\uFEFF' + rows.join('\n');
}
