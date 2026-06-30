import { useEffect, useState } from "react";
import { AppState, Platform } from "react-native";
import { useAuth } from "../context/AuthContext";
import {
  startHydrationAutoTracking,
  stopHydrationAutoTracking,
} from "../services/hydrationAutoTracker";

/**
 * Runs motion-based hydration detection ONLY while the app is in the
 * foreground and active. This is a deliberate platform constraint, not a
 * bug: neither iOS nor Android allow reliable continuous sensor sampling
 * in the background for a managed Expo app. See hydrationAutoTracker.js
 * for details, and AutoHydrationReminders for the complementary
 * scheduled-notification approach that covers the rest of the day.
 */
export default function AutoHydrationTracker() {
  const { user } = useAuth();
  const [appState, setAppState] = useState(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", setAppState);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const isForeground = appState === "active";
    const canTrack = !!user?.id && Platform.OS !== "web" && isForeground;

    if (canTrack) {
      void startHydrationAutoTracking({
        userId: user.id,
        sourceDevice: "PHONE",
      });
    } else {
      void stopHydrationAutoTracking();
    }

    // No setTimeout delay here — starting immediately when the app becomes
    // active/foreground avoids a dead zone where the user could take a sip
    // in the first few seconds after opening the app and have it go undetected.

    return () => {
      void stopHydrationAutoTracking();
    };
  }, [user?.id, appState]);

  // Renders nothing — background service only
  return null;
}
