import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../src/theme/colors';

function Icon({ glyph, focused }: { glyph: string; focused: boolean }) {
  return (
    <View style={[styles.icon, focused && styles.iconOn]}>
      <Text style={[styles.glyph, focused && styles.glyphOn]}>{glyph}</Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.yellow[700],
        tabBarInactiveTintColor: colors.gray[300],
        tabBarStyle: {
          backgroundColor: colors.gray[50],
          borderTopColor: colors.border,
          height: 64,
          paddingTop: 6,
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
