import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/build/layouts/Tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import {
  TabDiaryOffIcon,
  TabDiaryOnIcon,
  TabHomeOffIcon,
  TabHomeOnIcon,
  TabSettingOffIcon,
  TabSettingOnIcon,
} from '../../src/theme/icons';
import { fonts } from '../../src/theme/typography';

/** 피그마 Nav/Bottom Nav: 높이 56, 아래 4 패딩, 좌우 20, 탭 3개 */
const TAB_BAR_HEIGHT = 56;

const TAB_META: Record<string, { label: string; on: typeof TabHomeOnIcon; off: typeof TabHomeOffIcon }> = {
  diary: { label: '다이어리', on: TabDiaryOnIcon, off: TabDiaryOffIcon },
  home: { label: '홈', on: TabHomeOnIcon, off: TabHomeOffIcon },
  settings: { label: '설정', on: TabSettingOnIcon, off: TabSettingOffIcon },
};

function BottomNav({ state, navigation }: BottomTabBarProps) {
  // 시스템 내비게이션 바(제스처/3버튼) 높이는 기종마다 다르므로 런타임 inset을 그대로 더한다.
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

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
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
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

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="home"
      backBehavior="initialRoute"
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
      tabBar={(props) => <BottomNav {...props} />}
    >
      <Tabs.Screen name="diary" />
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
