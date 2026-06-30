import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { StatusBar } from "expo-status-bar";
import AutoStepTracker from "../components/AutoStepTracker";
import AutoHydrationTracker from "../components/AutoHydrationTracker";
import AutoHydrationRecorder from "../components/HydrationConfirmationPrompt";
import AppMenu from "../components/AppMenu";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function LayoutWithTheme() {
  const { mode } = useTheme();
  return (
    <>
      <AutoStepTracker />
      <AutoHydrationTracker />
      <AutoHydrationRecorder />
      <AppMenu />
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="food-scanner" />
        <Stack.Screen name="meal-suggestions" />
        <Stack.Screen name="pricing" />
        <Stack.Screen name="payment" />
        <Stack.Screen name="payment-success" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LayoutWithTheme />
      </ThemeProvider>
    </AuthProvider>
  );
}
