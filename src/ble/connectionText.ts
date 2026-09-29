import type { ConnectionState } from './FlowerClient';

export function connectionLabel(state: ConnectionState, stale: boolean): string {
  if (state === 'connected') return stale ? '연결됨 · 응답 없음' : '연결됨';
  switch (state) {
    case 'scanning':
      return '화분을 찾는 중';
    case 'connecting':
      return '연결하는 중';
    case 'poweredOff':
      return '블루투스 꺼짐';
    case 'unauthorized':
      return '블루투스 권한 없음';
    case 'unavailable':
      return '이 기기에서 블루투스 사용 불가';
    case 'notFound':
      return '화분을 찾지 못함';
    case 'error':
      return '연결 실패';
    default:
      return '연결되지 않음';
  }
}

/** 실패했을 때만 보여 주는 짧은 가이드 */
export function connectionGuide(state: ConnectionState, stale: boolean): string[] {
  if (state === 'connected' && stale) {
    return ['화분 전원이 켜져 있는지 봐 주세요.', '폰을 화분 가까이 가져가 보세요.'];
  }
  switch (state) {
    case 'poweredOff':
      return ['폰 설정에서 블루투스를 켜 주세요.'];
    case 'unauthorized':
      return ['설정 > 피움 에서 블루투스 권한을 허용해 주세요.'];
    case 'notFound':
      return [
        '화분 전원이 켜져 있는지 봐 주세요.',
        '화분과 같은 방에서 다시 시도해 주세요.',
        '다른 폰이 화분에 연결되어 있으면 그 연결을 끊어 주세요.',
      ];
    case 'error':
      return ['잠시 뒤 다시 시도해 주세요.', '계속 안 되면 화분 전원을 껐다 켜 주세요.'];
    default:
      return [];
  }
}
