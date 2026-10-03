import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { buildCsv } from './csv';
import type { AppState } from './types';

async function writeText(file: File, text: string) {
  file.create({ overwrite: true, intermediates: true });
  const written = file.write(text);
  if (written && typeof (written as Promise<void>).then === 'function') {
    await written;
  }
}

/** 기록 CSV를 폰에 쓰고 공유 시트를 엽니다. 파일 경로를 돌려줍니다. */
export async function exportCsvAndShare(state: AppState): Promise<string> {
  const csv = buildCsv(state);
  const pid = (state.profile?.participantId ?? 'record').replace(/[^A-Za-z0-9_-]/g, '');
  // 카카오톡은 앱 전용 폴더·text/csv 조합이면 첨부가 빠지는 경우가 있어 캐시에 일반 파일로 둡니다.
  const file = new File(Paths.cache, `pium-${pid}.csv`);
  await writeText(file, csv);

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('이 기기에서는 파일 공유를 열 수 없어요.');
  }

  try {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/octet-stream',
      dialogTitle: '피움 기록 내보내기',
      UTI: 'public.comma-separated-values-text',
    });
  } catch {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/plain',
      dialogTitle: '피움 기록 내보내기',
    });
  }
  return file.uri;
}

/** 물주기마다 로컬 CSV도 갱신해 둡니다. 앱이 죽어도 파일은 남습니다. */
export function writeLocalSnapshot(state: AppState): void {
  try {
    const file = new File(Paths.document, 'pium-latest.csv');
    file.create({ overwrite: true, intermediates: true });
    file.write(buildCsv(state));
  } catch {
    // 저장 실패는 조용히 넘어갑니다. AsyncStorage 원본은 따로 있습니다.
  }
}
