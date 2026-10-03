import { Stack } from 'expo-router';
import { colors } from '../../src/theme/colors';

export default function WaterLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.dark },
        animation: 'fade',
      }}
    />
  );
}
