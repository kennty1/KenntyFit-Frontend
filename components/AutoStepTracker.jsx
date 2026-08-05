import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { useAuth } from "../context/AuthContext";
import { syncStepTracking, stopStepTracking } from "../utils/stepCounter";

export default function AutoStepTracker() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id || Platform.OS === "web") return;

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void syncStepTracking();
      }
    });

    void syncStepTracking();

    return () => {
      subscription.remove();
    };
  }, [user?.id]);

  return null;
}
