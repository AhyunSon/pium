import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';

const TAB_BAR_CONTENT_HEIGHT = 58;

function Icon({ glyph, focused }: { glyph: string; focused: boolean }) {
  return (
    <View style={[styles.icon, focused && styles.iconOn]}>
      <Text style={[styles.glyph, focused && styles.glyphOn]}>{glyph}</Text>
    </View>
  );
}

export default function TabsLayout() {
  // 시스템 내비게이션 바(제스처 바/3버튼 바) 높이는 기종마다 다르므로
  // 런타임에 읽어서 탭바 높이에 그대로 더한다.
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.yellow[700],
        tabBarInactiveTintColor: colors.gray[300],
        tabBarStyle: {
          backgroundColor: colors.gray[50],
          borderTopColor: colors.border,
          height: TAB_BAR_CONTENT_HEIGHT + bottomInset,
          paddingTop: 6,
          paddingBottom: bottomInset,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500', marginTop: 2 },
      }}
    >
      <Tabs.Screen name="home" options={{ title: '홈', tabBarIcon: ({ focused }) => <Icon glyph="⌂" focused={focused} /> }} />
      <Tabs.Screen name="water" options={{ title: '물주기', tabBarIcon: ({ focused }) => <Icon glyph="◐" focused={focused} /> }} />
      <Tabs.Screen name="diary" options={{ title: '오늘', tabBarIcon: ({ focused }) => <Icon glyph="✎" focused={focused} /> }} />
      <Tabs.Screen name="calendar" options={{ title: '월간', tabBarIcon: ({ focused }) => <Icon glyph="▦" focused={focused} /> }} />
      <Tabs.Screen name="settings" options={{ title: '설정', tabBarIcon: ({ focused }) => <Icon glyph="⚙" focused={focused} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: { width: 28, height: 22, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  iconOn: { backgroundColor: colors.yellow[50] },
  glyph: { fontSize: 15, color: colors.gray[300] },
  glyphOn: { color: colors.yellow[700] },
});
