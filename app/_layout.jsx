import { useEffect } from "react";
import { BackHandler, Linking, Platform, StatusBar as RNStatusBar } from "react-native";
import { Stack, useRouter } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { StatusBar } from "expo-status-bar";
import AutoStepTracker from "../components/AutoStepTracker";
import AutoHydrationTracker from "../components/AutoHydrationTracker";
import AutoHydrationRecorder from "../components/HydrationConfirmationPrompt";
import AppMenu from "../components/AppMenu";
import SubscriptionSuccessBanner from "../components/SubscriptionSuccessBanner";
import { getSharedScreenOptions } from "../components/NavigationHeader";
import * as Notifications from "expo-notifications";
import { configureReminderChannel, requestNotificationPermission } from "../utils/notificationService";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function LayoutWithTheme() {
  const router = useRouter();
  const { mode, theme } = useTheme();

  useEffect(() => {
    RNStatusBar.setBarStyle(mode === "dark" ? "light-content" : "dark-content");
    if (Platform.OS === "android") {
      RNStatusBar.setBackgroundColor(theme?.background || "#0a0e1a");
    }
  }, [mode, theme?.background]);

  useEffect(() => {
    const bootstrapNotifications = async () => {
      try {
        await configureReminderChannel();
        if (Platform.OS !== "ios") {
          await requestNotificationPermission();
        }
      } catch (error) {
        console.warn("Notification bootstrap failed", error);
      }
    };

    bootstrapNotifications();
  }, []);

  useEffect(() => {
    if (Platform.OS === "android") {
      const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
        if (router.canGoBack()) {
          router.back();
          return true;
        }

        return false;
      });

      return () => {
        backHandler.remove();
      };
    }
  }, [router]);

  useEffect(() => {
    const handleIncomingUrl = (url) => {
      if (!url) return;

      try {
        const parsed = new URL(url);
        const pathname = parsed.pathname.replace(/^\/+/, "");
        const host = parsed.host.replace(/^\/+/, "");
        const route = pathname || host;
        const params = Object.fromEntries(parsed.searchParams.entries());

        if (route === "payment-success") {
          router.replace({ pathname: "/payment-success", params });
        }
      } catch {
        const normalized = url.replace(/^[a-zA-Z][a-zA-Z\d+.-]*:\/\/?/, "");
        const path = normalized.split("?")[0].replace(/^\/+/, "");
        const route = path.includes("/") ? path.split("/").pop() : path;

        if (route === "payment-success") {
          router.replace("/payment-success");
        }
      }
    };

    const subscription = Linking.addEventListener("url", ({ url }) => handleIncomingUrl(url));
    Linking.getInitialURL().then((url) => handleIncomingUrl(url)).catch(() => {});

    return () => subscription.remove();
  }, [router]);

  return (
    <>
      <AutoStepTracker />
      <AutoHydrationTracker />
      <AutoHydrationRecorder />
      <AppMenu />
      <SubscriptionSuccessBanner />
      <StatusBar
        style={mode === "dark" ? "light" : "dark"}
        backgroundColor={theme?.background || "#0a0e1a"}
        translucent={false}
      />
      <Stack screenOptions={getSharedScreenOptions(theme)}>
        <Stack.Screen name="index" options={{ title: "Home", headerShown: false }} />
        <Stack.Screen name="login" options={{ title: "Login", headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ title: "Settings" }} />
        <Stack.Screen name="profile" options={{ title: "Profile" }} />
        <Stack.Screen name="food-scanner" options={{ title: "Food Scanner" }} />
        <Stack.Screen name="meal-suggestions" options={{ title: "Meal Suggestions" }} />
        <Stack.Screen name="pricing" options={{ title: "Pricing" }} />
        <Stack.Screen name="payment" options={{ title: "Payment" }} />
        <Stack.Screen name="payment-success" options={{ title: "Payment Success" }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <LayoutWithTheme />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
