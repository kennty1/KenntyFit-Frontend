import { Tabs } from "expo-router";
import { Text } from "react-native";

const TAB_ICON = {
  index: "🏠",
  workouts: "💪",
  meals: "🥗",
  water: "💧",
  progress: "📈",
  profile: "👤",
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0a0e1a",
          borderTopColor: "#1e2535",
          paddingBottom: 6,
          paddingTop: 6,
          height: 60,
        },
        tabBarActiveTintColor: "#00e5a0",
        tabBarInactiveTintColor: "#6b7a99",
        tabBarIcon: ({ color }) => (
          <Text style={{ fontSize: 18 }}>{TAB_ICON[route.name] || "📄"}</Text>
        ),
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="workouts" options={{ title: "Workouts" }} />
      <Tabs.Screen name="meals" options={{ title: "Meals" }} />
      <Tabs.Screen name="water" options={{ title: "Water" }} />
      <Tabs.Screen name="progress" options={{ title: "Progress" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
