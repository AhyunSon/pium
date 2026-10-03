import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { AppState as RNAppState } from 'react-native';
import { writeLocalSnapshot } from './exportFile';
import { postSheetRow } from './sheets';
import { studyDay, toDateKey, toTimeKey, uid } from './time';
import {
  AppSettings,
  AppState,
  DEFAULT_SETTINGS,
  deviceNameFromNumber,
  DiaryEntry,
  INITIAL_STATE,
  Profile,
  QueuedRow,
  SheetRow,
  SurveyAnswers,
  WaterEvent,
} from './types';

/** v1 → v2: 성별 삭제, 기기 번호 추가, 다이어리가 8문항 설문으로 바뀜 */
const STORAGE_KEY = 'pium.state.v2';
/** 온보딩부터 다시 보기 위해 로컬 기록을 한 번만 비웁니다. */
const RESET_ONCE_KEY = 'pium.reset.once.2026-10-03-startover';

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

export type ProfileInput = Pick<Profile, 'name' | 'ageGroup' | 'habit' | 'deviceNumber'>;

type StoreValue = {
  state: AppState;
  hydrated: boolean;
  saveProfile: (profile: ProfileInput) => void;
  recordWater: (input: Omit<WaterEvent, 'id' | 'at' | 'date'>) => WaterEvent;
  saveDiary: (date: string, answers: SurveyAnswers) => DiaryEntry;
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
                settings: {
                  ...DEFAULT_SETTINGS,
                  ...(parsed.settings ?? {}),
                  sheetUrl: parsed.settings?.sheetUrl || DEFAULT_SETTINGS.sheetUrl,
                  adminPhone: DEFAULT_SETTINGS.adminPhone,
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
        ageGroup: input.ageGroup,
        habit: input.habit,
        deviceNumber: input.deviceNumber,
      };
      dispatch({ type: 'setProfile', profile: next });
      // 기기 번호가 바뀌면 BLE 이름도 같이 맞춘다 (관리자 화면에서 따로 덮어쓸 수 있음)
      if (!profile || profile.deviceNumber !== next.deviceNumber) {
        dispatch({ type: 'setSettings', settings: { deviceName: deviceNameFromNumber(next.deviceNumber) } });
      }
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
            ageGroup: next.ageGroup,
            habit: next.habit,
            deviceNumber: next.deviceNumber,
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
    (date, answers) => {
      const prev = state.diary.find((d) => d.date === date);
      const now = new Date().toISOString();
      const day = profile ? (studyDay(profile.studyStartDate, date) ?? 0) : 0;
      const entry: DiaryEntry = {
        ...answers,
        id: prev?.id ?? uid(),
        date,
        day,
        createdAt: prev?.createdAt ?? now,
        updatedAt: now,
      };
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
            day: entry.day,
            event: prev ? 'edited' : 'created',
            q1_noticedPetal: entry.q1_noticedPetal,
            q2_recalledHabit: entry.q2_recalledHabit,
            q3_petalStateWhenRecalled: entry.q3_petalStateWhenRecalled,
            q4_didHabit: entry.q4_didHabit,
            q5_influences: entry.q5_influences.join('|'),
            q5_reasons: entry.q5_reasons.join('|'),
            q5_otherText: entry.q5_otherText,
            q6_startDelay: entry.q6_startDelay,
            q6_laterReason: entry.q6_laterReason,
            q7_waterDelay: entry.q7_waterDelay,
            q7_laterReason: entry.q7_laterReason,
            q8_freeText: entry.q8_freeText,
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
