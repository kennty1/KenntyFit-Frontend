import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import WaterDetectionPrompt from "../../components/WaterDetectionPrompt";
import { StyleSheet } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useMemo } from "react";

const TAB_ICON = {
  index: { name: "home-outline" },
  workouts: { name: "dumbbell" },
  meals: { name: "silverware-fork-knife" },
  water: { name: "water" },
  progress: { name: "chart-line" },
  settings: { name: "cog-outline" },
};

export default function TabLayout() {
  const { theme } = useTheme();
  
  const styles = useMemo(() => StyleSheet.create({
    tabBar: {
      backgroundColor: theme.surface,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      height: 70,
      paddingBottom: 10,
      paddingTop: 8,
    },
  }), [theme]);
  
  return (
    <>
      <Tabs
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: theme.accent,
          tabBarInactiveTintColor: theme.muted,
          tabBarStyle: styles.tabBar,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name={TAB_ICON[route.name]?.name || "file-outline"}
              size={size || 24}
              color={color}
            />
          ),
          tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
        })}
      >
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="workouts" options={{ title: "Workouts" }} />
        <Tabs.Screen name="meals" options={{ title: "Meals" }} />
        <Tabs.Screen name="water" options={{ title: "Water" }} />
        <Tabs.Screen name="progress" options={{ title: "Progress" }} />
        <Tabs.Screen name="settings" options={{ title: "Settings" }} />
      </Tabs>
      <WaterDetectionPrompt />
    </>
  );
}
