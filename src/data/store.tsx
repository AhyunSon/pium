import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { AppState as RNAppState } from 'react-native';
import { IS_WORKSHOP } from '../config/variant';
import { writeLocalSnapshot } from './exportFile';
import { postSheetRow } from './sheets';
import { toDateKey, toTimeKey, uid } from './time';
import {
  AppSettings,
  AppState,
  clampFallHours,
  DEFAULT_SETTINGS,
  deviceNameFromNumber,
  FALL_HOURS_DEFAULT,
  INITIAL_STATE,
  Profile,
  QueuedRow,
  SheetRow,
  WaterEvent,
} from './types';

const STORAGE_KEY = IS_WORKSHOP ? 'pium.workshop.state.v3' : 'pium.state.v2';
const RESET_ONCE_KEY = IS_WORKSHOP
  ? 'pium.workshop.reset.once.v3'
  : 'pium.reset.once.2026-10-03-startover';

type Action =
  | { type: 'hydrate'; state: AppState }
  | { type: 'setProfile'; profile: Profile }
  | { type: 'addWater'; event: WaterEvent }
  | { type: 'setSettings'; settings: Partial<AppSettings> }
  | { type: 'enqueue'; row: QueuedRow }
  | { type: 'dequeue'; ids: string[] }
  | { type: 'bumpAttempts'; ids: string[] }
  | { type: 'resetAll' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'hydrate':
      return action.state;
    case 'setProfile':
      return { ...state, profile: action.profile };
    case 'addWater':
      return { ...state, waterEvents: [...state.waterEvents, action.event] };
    case 'setSettings':
      return { ...state, settings: { ...state.settings, ...action.settings } };
    case 'enqueue':
      return { ...state, queue: [...state.queue, action.row] };
    case 'dequeue':
      return { ...state, queue: state.queue.filter((q) => !action.ids.includes(q.id)) };
    case 'bumpAttempts':
      return {
        ...state,
        queue: state.queue.map((q) => (action.ids.includes(q.id) ? { ...q, attempts: q.attempts + 1 } : q)),
      };
    case 'resetAll':
      return { ...INITIAL_STATE, settings: state.settings };
    default:
      return state;
  }
}

export type ProfileInput = Pick<Profile, 'name' | 'ageGroup' | 'deviceNumber'>;

type StoreValue = {
  state: AppState;
  hydrated: boolean;
  saveProfile: (profile: ProfileInput) => void;
  recordWater: (input: Omit<WaterEvent, 'id' | 'at' | 'date' | 'fallHours' | 'mark'> & { mark?: WaterEvent['mark'] }) => WaterEvent;
  saveFallHours: (hours: number) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  flushQueue: () => Promise<void>;
  resetAll: () => Promise<void>;
  todayWater: WaterEvent[];
};

const StoreContext = createContext<StoreValue | null>(null);

function makeQueued(row: SheetRow): QueuedRow {
  return { id: uid(), row, attempts: 0, createdAt: new Date().toISOString() };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const alreadyReset = await AsyncStorage.getItem(RESET_ONCE_KEY);
        if (!alreadyReset) {
          await AsyncStorage.multiRemove([STORAGE_KEY]);
          await AsyncStorage.setItem(RESET_ONCE_KEY, '1');
        } else {
          const raw = await AsyncStorage.getItem(STORAGE_KEY);
          if (raw && alive) {
            const parsed = JSON.parse(raw) as Partial<AppState>;
            dispatch({
              type: 'hydrate',
              state: {
                ...INITIAL_STATE,
                ...parsed,
                waterEvents: parsed.waterEvents ?? [],
                queue: parsed.queue ?? [],
                settings: {
                  ...DEFAULT_SETTINGS,
                  ...(parsed.settings ?? {}),
                  sheetUrl: parsed.settings?.sheetUrl || DEFAULT_SETTINGS.sheetUrl,
                  adminPhone: DEFAULT_SETTINGS.adminPhone,
                  fallHours: clampFallHours(parsed.settings?.fallHours ?? FALL_HOURS_DEFAULT),
                  deviceName:
                    parsed.settings?.deviceName ||
                    (parsed.profile?.deviceNumber
                      ? deviceNameFromNumber(parsed.profile.deviceNumber)
                      : DEFAULT_SETTINGS.deviceName),
                },
              },
            });
          }
        }
      } finally {
        if (alive) setHydrated(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, hydrated]);

  const { queue, settings, profile } = state;
  const queueRef = useRef(queue);
  const flushingRef = useRef(false);
  queueRef.current = queue;

  const flushQueue = useCallback(async () => {
    if (!settings.sheetUrl || flushingRef.current) return;
    const items = queueRef.current;
    if (items.length === 0) return;
    flushingRef.current = true;
    const sent: string[] = [];
    const failed: string[] = [];
    try {
      for (const item of items) {
        const ok = await postSheetRow(settings.sheetUrl, item.row);
        (ok ? sent : failed).push(item.id);
      }
      if (sent.length) dispatch({ type: 'dequeue', ids: sent });
      if (failed.length) dispatch({ type: 'bumpAttempts', ids: failed });
    } finally {
      flushingRef.current = false;
    }
  }, [settings.sheetUrl]);

  useEffect(() => {
    if (!hydrated || queue.length === 0 || !settings.sheetUrl) return;
    const t = setTimeout(() => {
      flushQueue();
    }, 800);
    return () => clearTimeout(t);
  }, [hydrated, queue.length, settings.sheetUrl, flushQueue]);

  useEffect(() => {
    const sub = RNAppState.addEventListener('change', (s) => {
      if (s === 'active') flushQueue();
    });
    return () => sub.remove();
  }, [flushQueue]);

  const saveProfile = useCallback<StoreValue['saveProfile']>(
    (input) => {
      const next: Profile = {
        participantId: profile?.participantId ?? `P${Date.now().toString(36).toUpperCase()}`,
        createdAt: profile?.createdAt ?? new Date().toISOString(),
        studyStartDate: profile?.studyStartDate ?? toDateKey(),
        name: input.name,
        ageGroup: input.ageGroup,
        deviceNumber: input.deviceNumber,
      };
      dispatch({ type: 'setProfile', profile: next });
      if (!profile || profile.deviceNumber !== next.deviceNumber) {
        dispatch({ type: 'setSettings', settings: { deviceName: deviceNameFromNumber(next.deviceNumber) } });
      }
      dispatch({
        type: 'enqueue',
        row: makeQueued({
          kind: 'session',
          participantId: next.participantId,
          name: next.name,
          ageGroup: next.ageGroup ?? '',
          deviceNumber: next.deviceNumber,
          date: toDateKey(),
          time: toTimeKey(),
          payload: {
            event: profile ? 'profile-updated' : 'registered',
            studyStartDate: next.studyStartDate,
          },
        }),
      });
    },
    [profile],
  );

  const recordWater = useCallback<StoreValue['recordWater']>(
    (input) => {
      const now = new Date();
      const event: WaterEvent = {
        id: uid(),
        at: now.toISOString(),
        date: toDateKey(now),
        fallHours: state.settings.fallHours,
        mark: 'complete',
        ...input,
      };
      dispatch({ type: 'addWater', event });
      dispatch({
        type: 'enqueue',
        row: makeQueued({
          kind: 'water',
          participantId: profile?.participantId ?? '',
          name: profile?.name ?? '',
          date: event.date,
          time: toTimeKey(now),
          payload: {
            event: event.mark === 'bloom' ? 'water-bloom' : 'water-complete',
            pos: event.pos,
            posStart: event.posStart,
            posEnd: event.posEnd,
            wiltPercent: event.wiltPercent,
            deviceConnected: event.deviceConnected,
            pourDurationMs: event.pourDurationMs,
            startStopChanges: event.startStopChanges,
            bloomed: event.bloomed,
          },
        }),
      });
      if (event.mark !== 'bloom') {
        writeLocalSnapshot({ ...state, waterEvents: [...state.waterEvents, event] });
      }
      return event;
    },
    [profile, state],
  );

  const saveFallHours = useCallback(
    (hours: number) => {
      const next = clampFallHours(hours);
      dispatch({ type: 'setSettings', settings: { fallHours: next } });
      dispatch({
        type: 'enqueue',
        row: makeQueued({
          kind: 'session',
          participantId: profile?.participantId ?? '',
          name: profile?.name ?? '',
          ageGroup: profile?.ageGroup ?? '',
          deviceNumber: profile?.deviceNumber ?? '',
          date: toDateKey(),
          time: toTimeKey(),
          payload: {
            event: 'fall-hours',
            fallHours: next,
          },
        }),
      });
    },
    [profile],
  );

  const updateSettings = useCallback((next: Partial<AppSettings>) => {
    dispatch({ type: 'setSettings', settings: next });
  }, []);

  const resetAll = useCallback(async () => {
    dispatch({ type: 'resetAll' });
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const today = toDateKey();
  const todayWater = useMemo(() => state.waterEvents.filter((w) => w.date === today), [state.waterEvents, today]);

  const value = useMemo<StoreValue>(
    () => ({
      state,
      hydrated,
      saveProfile,
      recordWater,
      saveFallHours,
      updateSettings,
      flushQueue,
      resetAll,
      todayWater,
    }),
    [state, hydrated, saveProfile, recordWater, saveFallHours, updateSettings, flushQueue, resetAll, todayWater],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
