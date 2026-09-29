import type { SheetRow } from './types';

/**
 * Google Apps Script 웹앱으로 한 행을 보냅니다.
 * text/plain 으로 보내야 preflight 없이 통과합니다.
 * 스크립트 쪽 예시는 docs/apps-script.gs 참고.
 */
export async function postSheetRow(url: string, row: SheetRow): Promise<boolean> {
  if (!url) return false;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(flattenRow(row)),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function flattenRow(row: SheetRow): Record<string, string | number | boolean | null> {
  return {
    kind: row.kind,
    participantId: row.participantId,
    name: row.name,
    date: row.date,
    time: row.time,
    ...row.payload,
    sentAt: new Date().toISOString(),
  };
}
