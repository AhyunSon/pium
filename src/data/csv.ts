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

  rows.push(line(['section', 'participantId', 'name', 'ageGroup', 'habit', 'deviceNumber', 'studyStartDate']));
  rows.push(line(['profile', p?.participantId, p?.name, p?.ageGroup, p?.habit, p?.deviceNumber, p?.studyStartDate]));
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
      'day',
      'q1_noticedPetal',
      'q2_recalledHabit',
      'q3_petalStateWhenRecalled',
      'q4_didHabit',
      'q5_influences',
      'q5_reasons',
      'q5_otherText',
      'q6_startDelay',
      'q6_laterReason',
      'q7_waterDelay',
      'q7_laterReason',
      'q8_freeText',
      'createdAt',
      'updatedAt',
    ]),
  );
  for (const d of [...state.diary].sort((a, b) => a.date.localeCompare(b.date))) {
    rows.push(
      line([
        'diary',
        d.id,
        d.date,
        d.day,
        d.q1_noticedPetal,
        d.q2_recalledHabit,
        d.q3_petalStateWhenRecalled,
        d.q4_didHabit,
        d.q5_influences.join('|'),
        d.q5_reasons.join('|'),
        d.q5_otherText,
        d.q6_startDelay,
        d.q6_laterReason ?? '',
        d.q7_waterDelay,
        d.q7_laterReason ?? '',
        d.q8_freeText,
        d.createdAt,
        d.updatedAt,
      ]),
    );
  }

  return '\uFEFF' + rows.join('\n');
}
