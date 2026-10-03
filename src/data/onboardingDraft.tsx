import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import type { AgeGroup } from './types';

export type OnboardingDraft = {
  name: string;
  ageGroup: AgeGroup | null;
  habit: string;
  deviceNumber: string;
};

type DraftValue = {
  draft: OnboardingDraft;
  setDraft: (patch: Partial<OnboardingDraft>) => void;
};

const DraftContext = createContext<DraftValue | null>(null);

export function OnboardingDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraftState] = useState<OnboardingDraft>({
    name: '',
    ageGroup: null,
    habit: '',
    deviceNumber: '',
  });
  const value = useMemo<DraftValue>(
    () => ({ draft, setDraft: (patch) => setDraftState((d) => ({ ...d, ...patch })) }),
    [draft],
  );
  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

export function useOnboardingDraft(): DraftValue {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error('useOnboardingDraft outside OnboardingDraftProvider');
  return ctx;
}
