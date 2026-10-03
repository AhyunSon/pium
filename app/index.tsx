import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useStore } from '../src/data/store';
import { colors } from '../src/theme/colors';
import { LogoSplashIcon } from '../src/theme/icons';

/** 피그마 Splash (358:11310): grey/base 배경, 가운데 로고 150×34 */
export default function SplashScreen() {
  const router = useRouter();
  const { hydrated, state } = useStore();

  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => {
      router.replace(state.profile ? '/home' : '/onboarding');
    }, 900);
    return () => clearTimeout(timer);
  }, [hydrated, state.profile, router]);

  return (
    <View style={styles.wrap}>
      <LogoSplashIcon />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.grey.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
