import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { EMPTY_SURVEY, SurveyAnswers } from './types';

export type SurveyMode = 'write' | 'review' | 'edit';

type SurveyValue = {
  date: string;
  mode: SurveyMode;
  answers: SurveyAnswers;
  setAnswers: (patch: Partial<SurveyAnswers>) => void;
  setMode: (mode: SurveyMode) => void;
};

const SurveyContext = createContext<SurveyValue | null>(null);

export function SurveyDraftProvider({
  date,
  initial,
  initialMode,
  children,
}: {
  date: string;
  initial?: SurveyAnswers;
  initialMode?: SurveyMode;
  children: ReactNode;
}) {
  const [answers, setAnswersState] = useState<SurveyAnswers>(initial ?? EMPTY_SURVEY);
  const [mode, setMode] = useState<SurveyMode>(initialMode ?? 'write');
  const value = useMemo<SurveyValue>(
    () => ({
      date,
      mode,
      answers,
      setAnswers: (patch) => setAnswersState((a) => ({ ...a, ...patch })),
      setMode,
    }),
    [date, mode, answers],
  );
  return <SurveyContext.Provider value={value}>{children}</SurveyContext.Provider>;
}

export function useSurveyDraft(): SurveyValue {
  const ctx = useContext(SurveyContext);
  if (!ctx) throw new Error('useSurveyDraft outside SurveyDraftProvider');
  return ctx;
}
