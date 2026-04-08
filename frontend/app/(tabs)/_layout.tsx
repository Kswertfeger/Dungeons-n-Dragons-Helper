import { HapticTab } from '@/components/haptic-tab';
import { DnDColors } from '@/constants/colors';
import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: DnDColors.tabBackground,
          borderTopColor: DnDColors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: DnDColors.tabActive,
        tabBarInactiveTintColor: DnDColors.tabInactive,
        tabBarButton: HapticTab,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Characters',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="dice-scanner"
        options={{
          title: 'Dice',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="casino" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="roll-history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="history" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
