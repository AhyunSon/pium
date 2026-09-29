import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { AppState as RNAppState } from 'react-native';
import { writeLocalSnapshot } from './exportFile';
import { postSheetRow } from './sheets';
import { toDateKey, toTimeKey, uid } from './time';
import {
  AppSettings,
  AppState,
  DEFAULT_SETTINGS,
  DiaryEntry,
  INITIAL_STATE,
  Profile,
  QueuedRow,
  SheetRow,
  WaterEvent,
} from './types';

const STORAGE_KEY = 'pium.state.v1';

type Action =
  | { type: 'hydrate'; state: AppState }
  | { type: 'setProfile'; profile: Profile }
  | { type: 'addWater'; event: WaterEvent }
  | { type: 'upsertDiary'; entry: DiaryEntry }
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
    case 'upsertDiary': {
      const others = state.diary.filter((d) => d.date !== action.entry.date);
      return { ...state, diary: [...others, action.entry] };
    }
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

type ProfileInput = Pick<Profile, 'name' | 'gender' | 'ageGroup' | 'habit'>;

type StoreValue = {
  state: AppState;
  hydrated: boolean;
  saveProfile: (profile: ProfileInput) => void;
  recordWater: (input: Omit<WaterEvent, 'id' | 'at' | 'date'>) => WaterEvent;
  saveDiary: (entry: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>) => DiaryEntry;
  updateSettings: (settings: Partial<AppSettings>) => void;
  flushQueue: () => Promise<void>;
  resetAll: () => Promise<void>;
  todayDiary: DiaryEntry | null;
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
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw && alive) {
          const parsed = JSON.parse(raw) as Partial<AppState>;
          dispatch({
            type: 'hydrate',
            state: {
              ...INITIAL_STATE,
              ...parsed,
              settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
            },
          });
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

  const flushQueue = useCallback(async () => {
    if (!settings.sheetUrl || queue.length === 0) return;
    const sent: string[] = [];
    const failed: string[] = [];
    for (const item of queue) {
      const ok = await postSheetRow(settings.sheetUrl, item.row);
      (ok ? sent : failed).push(item.id);
    }
    if (sent.length) dispatch({ type: 'dequeue', ids: sent });
    if (failed.length) dispatch({ type: 'bumpAttempts', ids: failed });
  }, [queue, settings.sheetUrl]);

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
        gender: input.gender,
        ageGroup: input.ageGroup,
        habit: input.habit,
      };
      dispatch({ type: 'setProfile', profile: next });
      dispatch({
        type: 'enqueue',
        row: makeQueued({
          kind: 'session',
          participantId: next.participantId,
          name: next.name,
          date: toDateKey(),
          time: toTimeKey(),
          payload: {
            event: profile ? 'profile-updated' : 'registered',
            gender: next.gender,
            ageGroup: next.ageGroup,
            habit: next.habit,
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
      const event: WaterEvent = { id: uid(), at: now.toISOString(), date: toDateKey(now), ...input };
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
            wiltPos: event.wiltPos,
            wiltPercent: event.wiltPercent,
            deviceConnected: event.deviceConnected,
            pourDurationMs: event.pourDurationMs,
          },
        }),
      });
      writeLocalSnapshot({ ...state, waterEvents: [...state.waterEvents, event] });
      return event;
    },
    [profile, state],
  );

  const saveDiary = useCallback<StoreValue['saveDiary']>(
    (input) => {
      const prev = state.diary.find((d) => d.date === input.date);
      const now = new Date().toISOString();
      const entry: DiaryEntry = { id: prev?.id ?? uid(), createdAt: prev?.createdAt ?? now, updatedAt: now, ...input };
      dispatch({ type: 'upsertDiary', entry });
      dispatch({
        type: 'enqueue',
        row: makeQueued({
          kind: 'diary',
          participantId: profile?.participantId ?? '',
          name: profile?.name ?? '',
          date: entry.date,
          time: toTimeKey(),
          payload: {
            didHabit: entry.didHabit,
            startTime: entry.startTime,
            trigger: entry.trigger,
            triggerNote: entry.triggerNote,
            wiltAtWater: entry.wiltAtWater,
            note: entry.note,
          },
        }),
      });
      writeLocalSnapshot({ ...state, diary: [...state.diary.filter((d) => d.date !== entry.date), entry] });
      return entry;
    },
    [profile, state],
  );

  const updateSettings = useCallback((next: Partial<AppSettings>) => {
    dispatch({ type: 'setSettings', settings: next });
  }, []);

  const resetAll = useCallback(async () => {
    dispatch({ type: 'resetAll' });
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const today = toDateKey();
  const todayDiary = useMemo(() => state.diary.find((d) => d.date === today) ?? null, [state.diary, today]);
  const todayWater = useMemo(() => state.waterEvents.filter((w) => w.date === today), [state.waterEvents, today]);

  const value = useMemo<StoreValue>(
    () => ({
      state,
      hydrated,
      saveProfile,
      recordWater,
      saveDiary,
      updateSettings,
      flushQueue,
      resetAll,
      todayDiary,
      todayWater,
    }),
    [state, hydrated, saveProfile, recordWater, saveDiary, updateSettings, flushQueue, resetAll, todayDiary, todayWater],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
