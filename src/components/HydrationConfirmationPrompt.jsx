import React, { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import { HYDRATION_EVENTS, hydrationEmitter } from "../services/hydrationAutoTracker";

export default function HydrationConfirmationPrompt() {
  const { user } = useAuth();
  const savingRef = useRef(false);

  useEffect(() => {
    const handler = (detail) => {
      if (!user?.id) return;
      if (String(detail.userId) !== String(user.id)) return;
      if (savingRef.current) return;

      savingRef.current = true;
      (async () => {
        try {
          await API.post("/water-intake", {
            userId: user.id,
            amountMl: detail.amountMl ?? 250,
            date: (detail.detectedAt ? new Date(detail.detectedAt) : new Date())
              .toISOString()
              .slice(0, 10),
            notes: "Auto-recorded hydration event from motion detection.",
            sourceDevice: detail.sourceDevice || "PHONE",
            sensorType: detail.sensorType || "MOTION_PATTERN",
            confidenceScore: detail.confidenceScore,
            sipCount: detail.sipCount,
            detectedAt: detail.detectedAt,
          });
          hydrationEmitter.emit(HYDRATION_EVENTS.CONFIRMED, {
            userId: user.id,
            amountMl: detail.amountMl ?? 250,
          });
        } catch (error) {
          console.warn(
            "Hydration auto-record failed:",
            error?.response?.data?.message || error?.message || error
          );
        } finally {
          savingRef.current = false;
        }
      })();
    };
    hydrationEmitter.on(HYDRATION_EVENTS.DETECTED, handler);
    return () => hydrationEmitter.off(HYDRATION_EVENTS.DETECTED, handler);
  }, [user?.id]);

  return null;
}
