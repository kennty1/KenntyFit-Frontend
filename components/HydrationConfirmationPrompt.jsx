import React, { useEffect, useState, useMemo } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, ActivityIndicator, Platform,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import { HYDRATION_EVENTS, hydrationEmitter } from "../services/hydrationAutoTracker";

const formatSourceLabel = (src) =>
  src ? String(src).replace(/_/g, " ").toLowerCase() : "device";

export default function HydrationConfirmationPrompt() {
  const { user } = useAuth();
  const [pending, setPending] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const active = useMemo(() => {
    if (!pending) return null;
    if (user?.id && String(user.id) !== String(pending.userId)) return null;
    return pending;
  }, [pending, user?.id]);

  useEffect(() => {
    const handler = (detail) => {
      if (!user?.id) return;
      if (String(detail.userId) !== String(user.id)) return;
      setMessage("");
      setPending(detail);
    };
    hydrationEmitter.on(HYDRATION_EVENTS.DETECTED, handler);
    return () => hydrationEmitter.off(HYDRATION_EVENTS.DETECTED, handler);
  }, [user?.id]);

  const dismiss = () => { setPending(null); setMessage(""); };

  const confirmWater = async () => {
    if (!active || !user?.id) return;
    setSaving(true); setMessage("");
    try {
      // ✅ Correct endpoint: POST /api/water-intake/user/{userId}/auto-track
      await API.post(`/water-intake/user/${user.id}/auto-track`, {
        amountMl: active.amountMl || 250,
        deviceWithUser: true,
        sourceDevice: active.sourceDevice || "PHONE",
        sensorType: active.sensorType || "MOTION_PATTERN",
        beverageType: "WATER",
        sourceReference: "AUTO_ON_BODY_MOTION_CONFIRMED",
        source: active.sourceDevice || "PHONE",
        confidenceScore: active.confidenceScore || 0.72,
        sipCount: active.sipCount || 2,
        detectedAt: active.detectedAt || new Date().toISOString(),
        notes: `Confirmed as water on ${Platform.OS} after liquid detection.`,
      });
      hydrationEmitter.emit(HYDRATION_EVENTS.CONFIRMED, {});
      setMessage("Water recorded ✅");
      setPending(null);
    } catch (e) {
      const msg = e.response?.data?.message || e.response?.data || e.message;
      console.warn("Hydration auto-record failed:", msg);
      setMessage(msg || "Could not save the water record.");
    } finally { setSaving(false); }
  };

  if (!active) return null;

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>Liquid detected 💧</Text>
          <Text style={styles.title}>Are you drinking water?</Text>
          <Text style={styles.body}>
            The app detected a drinking pattern on your{" "}
            {formatSourceLabel(active.sourceDevice)}. If it is water, confirm
            it and it will be recorded ({active.amountMl || 250}ml).
            If not, it won't be saved.
          </Text>

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.btnConfirm}
              onPress={confirmWater}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#0a0e1a" />
                : <Text style={styles.btnConfirmText}>✅ It is water</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnDismiss}
              onPress={dismiss}
              disabled={saving}
            >
              <Text style={styles.btnDismissText}>❌ Not water</Text>
            </TouchableOpacity>
          </View>

          {message ? <Text style={styles.message}>{message}</Text> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(5,7,13,0.78)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#111827",
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: "#1e2535",
  },
  eyebrow: {
    fontSize: 11,
    color: "#6b7a99",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 10,
  },
  body: {
    fontSize: 13,
    color: "#6b7a99",
    lineHeight: 20,
    marginBottom: 20,
  },
  btnRow: { flexDirection: "row", gap: 10 },
  btnConfirm: {
    flex: 1,
    backgroundColor: "#00e5a0",
    borderRadius: 10,
    padding: 13,
    alignItems: "center",
  },
  btnConfirmText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0a0e1a",
  },
  btnDismiss: {
    flex: 1,
    backgroundColor: "#1e2535",
    borderRadius: 10,
    padding: 13,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a3548",
  },
  btnDismissText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  message: {
    marginTop: 12,
    fontSize: 12,
    color: "#6b7a99",
    textAlign: "center",
  },
});
