import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useStore } from '../data/store';
import { FlowerCommand, STATUS_STALE_MS, wiltPercentFromPos } from './constants';
import { ConnectionState, createFlowerClient, FlowerClient } from './FlowerClient';
import { FlowerStatus } from './parseStatus';

export type WaterResult = {
  waterPos: number | null;
  wiltPercent: number | null;
  connected: boolean;
};

type FlowerValue = {
  kind: 'ble' | 'mock';
  connection: ConnectionState;
  status: FlowerStatus | null;
  pos: number | null;
  wiltPercent: number | null;
  lastSeenAt: number | null;
  lastError: string | null;
  /** 상태 알림이 한동안 끊겼는지 */
  stale: boolean;
  /** 로봇이 마지막으로 "활짝 핌"(HOME OK 또는 위치 0 정지)을 알린 시각. Blooming → Bloomed 전환에 쓴다 */
  lastBloomedAt: number | null;
  connect: () => Promise<ConnectionState>;
  disconnect: () => Promise<void>;
  send: (command: FlowerCommand) => Promise<void>;
  /** RESET 전송 후 WATER_POS 응답을 기다립니다. */
  water: () => Promise<WaterResult>;
};

const FlowerContext = createContext<FlowerValue | null>(null);

type WaterWaiter = (pos: number) => void;

/** WATER_POS 응답을 기다리는 콜백 모음. 렌더와 무관한 가변 객체라 useState로 한 번만 만듭니다. */
type Waiters = { list: WaterWaiter[] };

export function FlowerProvider({ children }: { children: ReactNode }) {
  const { state: appState } = useStore();
  const [client] = useState<FlowerClient>(() => createFlowerClient());
  const [waiters] = useState<Waiters>(() => ({ list: [] }));

  const [connection, setConnection] = useState<ConnectionState>(() => client.getState());
  const [status, setStatus] = useState<FlowerStatus | null>(null);
  const [pos, setPos] = useState<number | null>(null);
  const [lastSeenAt, setLastSeenAt] = useState<number | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [lastBloomedAt, setLastBloomedAt] = useState<number | null>(null);

  useEffect(() => {
    const offState = client.onState((s) => {
      setConnection(s);
      if (s === 'connected') setLastError(null);
      if (s !== 'connected') setStale(false);
    });
    const offStatus = client.onStatus((s) => {
      setStatus(s);
      setLastSeenAt(Date.now());
      setStale(false);
      if (s.pos !== null) setPos(s.pos);
      if (s.homeOk || (s.motor === 'STOP' && s.pos === 0)) setLastBloomedAt(Date.now());
      if (s.waterPos !== null) {
        const pending = waiters.list;
        waiters.list = [];
        pending.forEach((w) => w(s.waterPos as number));
      }
    });
    const offError = client.onError((m) => setLastError(m));
    return () => {
      offState();
      offStatus();
      offError();
    };
  }, [client, waiters]);

  useEffect(() => () => client.destroy(), [client]);

  useEffect(() => {
    if (connection !== 'connected') return;
    const t = setInterval(() => {
      if (lastSeenAt && Date.now() - lastSeenAt > STATUS_STALE_MS) setStale(true);
    }, 1000);
    return () => clearInterval(t);
  }, [connection, lastSeenAt]);

  const connect = useCallback(async () => {
    setLastError(null);
    await client.connect(appState.settings.deviceName);
    return client.getState();
  }, [client, appState.settings.deviceName]);

  const disconnect = useCallback(() => client.disconnect(), [client]);
  const send = useCallback((c: FlowerCommand) => client.send(c), [client]);

  const water = useCallback(async (): Promise<WaterResult> => {
    if (client.getState() !== 'connected') {
      return { waterPos: null, wiltPercent: null, connected: false };
    }
    setLastBloomedAt(null);
    const waitPos = new Promise<number | null>((resolve) => {
      const onPos: WaterWaiter = (p) => {
        clearTimeout(timer);
        resolve(p);
      };
      const timer = setTimeout(() => {
        waiters.list = waiters.list.filter((w) => w !== onPos);
        resolve(null);
      }, 3000);
      waiters.list.push(onPos);
    });
    try {
      await client.send('RESET');
    } catch (e) {
      setLastError(e instanceof Error ? e.message : 'RESET 전송 실패');
      return { waterPos: null, wiltPercent: pos !== null ? wiltPercentFromPos(pos) : null, connected: false };
    }
    const waterPos = await waitPos;
    const finalPos = waterPos ?? pos;
    return {
      waterPos: finalPos,
      wiltPercent: finalPos !== null ? wiltPercentFromPos(finalPos) : null,
      connected: true,
    };
  }, [client, waiters, pos]);

  const value = useMemo<FlowerValue>(
    () => ({
      kind: client.kind,
      connection,
      status,
      pos,
      wiltPercent: pos !== null ? wiltPercentFromPos(pos) : null,
      lastSeenAt,
      lastError,
      stale,
      lastBloomedAt,
      connect,
      disconnect,
      send,
      water,
    }),
    [client.kind, connection, status, pos, lastSeenAt, lastError, stale, lastBloomedAt, connect, disconnect, send, water],
  );

  return <FlowerContext.Provider value={value}>{children}</FlowerContext.Provider>;
}

export function useFlower(): FlowerValue {
  const ctx = useContext(FlowerContext);
  if (!ctx) throw new Error('useFlower must be used inside FlowerProvider');
  return ctx;
}
