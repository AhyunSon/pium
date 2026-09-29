import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { buildCsv } from './csv';
import type { AppState } from './types';

/** 기록 CSV를 폰에 쓰고 공유 시트를 엽니다. 파일 경로를 돌려줍니다. */
export async function exportCsvAndShare(state: AppState): Promise<string> {
  const csv = buildCsv(state);
  const pid = state.profile?.participantId ?? 'unknown';
  const file = new File(Paths.document, `pium-${pid}-${Date.now()}.csv`);
  file.create({ overwrite: true });
  file.write(csv);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/csv',
      dialogTitle: '피움 기록 내보내기',
      UTI: 'public.comma-separated-values-text',
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
