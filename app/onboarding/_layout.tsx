import { Stack } from 'expo-router';
import { OnboardingDraftProvider } from '../../src/data/onboardingDraft';
import { colors } from '../../src/theme/colors';

export default function OnboardingLayout() {
  return (
    <OnboardingDraftProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_right',
        }}
      />
    </OnboardingDraftProvider>
  );
}
