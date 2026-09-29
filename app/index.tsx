import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useStore } from '../src/data/store';
import { colors } from '../src/theme/colors';

export default function SplashScreen() {
  const router = useRouter();
  const { hydrated, state } = useStore();

  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => {
      router.replace(state.profile ? '/home' : '/onboarding');
    }, 700);
    return () => clearTimeout(timer);
  }, [hydrated, state.profile, router]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.mark}>피움</Text>
      <Text style={styles.sub}>Pium</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.yellow[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: { fontSize: 36, fontWeight: '600', color: colors.yellow[600], letterSpacing: 4 },
  sub: { marginTop: 8, fontSize: 14, color: colors.yellow[400], letterSpacing: 2 },
});
