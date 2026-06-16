import { useEffect, useState } from "react";
import { AppState, Platform } from "react-native";
import { useAuth } from "../context/AuthContext";
import { syncStepTracking, stopStepTracking } from "../utils/stepCounter";

export default function AutoStepTracker() {
  const { user } = useAuth();
  const [appState, setAppState] = useState(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", setAppState);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    let intervalId = null;

    const run = async () => {
      if (!user?.id || Platform.OS === "web" || appState !== "active") {
        stopStepTracking(intervalId);
        return;
      }

      await syncStepTracking();
    };

    void run();

    return () => {
      stopStepTracking(intervalId);
    };
  }, [user?.id, appState]);

  return null;
}
