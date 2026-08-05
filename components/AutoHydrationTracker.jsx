import { useEffect } from "react";
import { Platform } from "react-native";
import { useAuth } from "../context/AuthContext";
import {
  startHydrationAutoTracking,
  stopHydrationAutoTracking,
} from "../services/hydrationAutoTracker";

export default function AutoHydrationTracker() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id || Platform.OS === "web") return;

    void startHydrationAutoTracking({
      userId: user.id,
      sourceDevice: "PHONE",
    });

    return () => {
      void stopHydrationAutoTracking();
    };
  }, [user?.id]);

  return null;
}
