import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/build/layouts/Tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../src/theme/colors';
import {
  TabFallOffIcon,
  TabFallOnIcon,
  TabHomeOffIcon,
  TabHomeOnIcon,
  TabSettingOffIcon,
  TabSettingOnIcon,
} from '../../src/theme/icons';
import { fonts } from '../../src/theme/typography';

/** 피그마 Nav/Bottom Nav: 높이 56, 아래 4 패딩, 좌우 20, 탭 3개 */
const TAB_BAR_HEIGHT = 56;

const TAB_META: Record<string, { label: string; on: typeof TabHomeOnIcon; off: typeof TabHomeOffIcon }> = {
  fall: { label: '낙화 시간', on: TabFallOnIcon, off: TabFallOffIcon },
  home: { label: '홈', on: TabHomeOnIcon, off: TabHomeOffIcon },
  settings: { label: '설정', on: TabSettingOnIcon, off: TabSettingOffIcon },
};

/**
 * Expo Router 58 커스텀 탭바.
 * - 예전: navigation.emit / navigation.navigate (SDK 57)
 * - 지금: emitter.emit / navigateToTab(route.key)
 */
function BottomNav({ state, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const bottomInset = Math.max(insets?.bottom ?? 0, 8);

  return (
    <View style={[styles.bar, { height: TAB_BAR_HEIGHT + bottomInset, paddingBottom: bottomInset + 4 }]}>
      {state.routes.map((route, index) => {
        const meta = TAB_META[route.name];
        if (!meta) return null;
        const focused = state.index === index;
        const Icon = focused ? meta.on : meta.off;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            onPress={() => {
              const event = emitter?.emit?.({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event?.defaultPrevented) {
                navigateToTab?.(route.key);
              }
            }}
            style={styles.tab}
          >
            <Icon width={24} height={24} />
            <Text style={[styles.label, focused && styles.labelOn]}>{meta.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export const unstable_settings = {
  initialRouteName: 'home',
};

export default function TabsLayout() {
  return (
    <Tabs
      backBehavior="initialRoute"
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
      tabBar={(props) => <BottomNav {...props} />}
    >
      <Tabs.Screen name="fall" />
      <Tabs.Screen name="home" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    backgroundColor: colors.grey.base,
  },
  tab: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center', gap: 2 },
  label: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 14, color: colors.grey[300] },
  labelOn: { color: colors.primary[700] },
});
