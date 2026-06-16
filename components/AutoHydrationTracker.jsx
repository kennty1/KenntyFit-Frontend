import { useEffect, useState } from "react";
import { AppState, Platform } from "react-native";
import { useAuth } from "../context/AuthContext";
import {
  startHydrationAutoTracking,
  stopHydrationAutoTracking,
} from "../services/hydrationAutoTracker";

export default function AutoHydrationTracker() {
  const { user } = useAuth();
  const [appState, setAppState] = useState(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", setAppState);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    let timeoutId = null;

    const run = async () => {
      // Only run on physical devices (not web/simulator)
      if (!user?.id || Platform.OS === "web" || appState !== "active") {
        await stopHydrationAutoTracking();
        return;
      }

      timeoutId = setTimeout(() => {
        void startHydrationAutoTracking({
          userId: user.id,
          sourceDevice: "PHONE",
        });
      }, 10000);
    };

    void run();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      void stopHydrationAutoTracking();
    };
  }, [user?.id, appState]);

  // Renders nothing — background service only
  return null;
}
