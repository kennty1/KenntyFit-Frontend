import React, { useEffect, useState } from "react";
import {
  View, Text, Switch, TouchableOpacity, StyleSheet, Alert, Platform,
} from "react-native";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SETTINGS_KEY = "kenntyfit_notification_settings";

const DEFAULT_SETTINGS = {
  enabled: true,
  workout: true,
  water: true,
  meal: true,
  sound: true,
  vibrate: true,
};

function SwitchRow({ label, description, value, onChange }) {
  return (
    <View style={styles.switchRow}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={styles.switchLabel}>{label}</Text>
        <Text style={styles.switchDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: "#1e2535", true: "#00e5a0" }}
        thumbColor={value ? "#0a0e1a" : "#6b7a99"}
      />
    </View>
  );
}

export default function NotificationSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [permStatus, setPermStatus] = useState("loading");
  const [saved, setSaved] = useState("");
  const isAndroid = Platform.OS === "android";

  useEffect(() => {
    loadSettings();
    checkPerm();
  }, []);

  const checkPerm = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermStatus(status);
  };

  const loadSettings = async () => {
    const stored = await AsyncStorage.getItem(SETTINGS_KEY).catch(() => null);
    if (stored) setSettings(JSON.parse(stored));
  };

  const set = (key) => (value) => setSettings((s) => ({ ...s, [key]: value }));

  const handleSave = async () => {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    setSaved("Saved ✓");
    setTimeout(() => setSaved(""), 2000);
  };

  const handleReset = async () => {
    setSettings(DEFAULT_SETTINGS);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    setSaved("Reset ✓");
    setTimeout(() => setSaved(""), 2000);
  };

  const enableNotifications = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setPermStatus(status);
    if (status === "granted") {
      set("enabled")(true);
    } else {
      Alert.alert("Permission Denied", "Please enable notifications in your device settings to receive reminders.");
    }
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Notifications</Text>
          <Text style={styles.cardSub}>
            Native alarms, vibration, and device permissions are controlled here.
          </Text>
        </View>
        <TouchableOpacity style={styles.enableBtn} onPress={enableNotifications}>
          <Text style={styles.enableBtnText}>Enable on Device</Text>
        </TouchableOpacity>
      </View>

      {/* Status row */}
      <View style={styles.statusRow}>
        <Text style={styles.statusText}>
          Permission: <Text style={styles.statusValue}>
            {permStatus === "loading" ? "Checking..." : permStatus === "granted" ? "Granted ✓" : "Not granted"}
          </Text>
        </Text>
        {saved ? <Text style={styles.savedText}>{saved}</Text> : null}
      </View>

      {/* Switches */}
      <SwitchRow label="Master switch" description="Turn all notifications on or off." value={settings.enabled} onChange={set("enabled")} />
      <SwitchRow label="Workout alerts" description="Allow workout reminder alarms." value={settings.workout} onChange={set("workout")} />
      <SwitchRow label="Water alerts" description="Allow hydration reminder alarms." value={settings.water} onChange={set("water")} />
      <SwitchRow label="Meal alerts" description="Allow meal reminder alarms." value={settings.meal} onChange={set("meal")} />
      <SwitchRow label="Sound" description="Play alert sound when alarms fire." value={settings.sound} onChange={set("sound")} />
      <SwitchRow label="Vibration" description="Vibrate when an alarm fires." value={settings.vibrate} onChange={set("vibrate")} />

      {/* Action buttons */}
      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.btnPrimary} onPress={handleSave}>
          <Text style={styles.btnPrimaryText}>Save Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnGhost} onPress={handleReset}>
          <Text style={styles.btnGhostText}>Reset Defaults</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#111827", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#1e2535" },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#fff" },
  cardSub: { fontSize: 12, color: "#6b7a99", marginTop: 3, lineHeight: 18 },
  enableBtn: { backgroundColor: "#00e5a0", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  enableBtnText: { fontSize: 11, fontWeight: "700", color: "#0a0e1a" },
  statusRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  statusText: { fontSize: 12, color: "#6b7a99" },
  statusValue: { color: "#fff", fontWeight: "600" },
  savedText: { fontSize: 12, color: "#00e5a0", fontWeight: "600" },
  switchRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#1e2535" },
  switchLabel: { fontSize: 14, fontWeight: "600", color: "#fff", marginBottom: 3 },
  switchDesc: { fontSize: 12, color: "#6b7a99", lineHeight: 16 },
  btnRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  btnPrimary: { flex: 1, backgroundColor: "#00e5a0", borderRadius: 10, padding: 12, alignItems: "center" },
  btnPrimaryText: { fontSize: 13, fontWeight: "700", color: "#0a0e1a" },
  btnGhost: { flex: 1, borderRadius: 10, padding: 12, alignItems: "center", borderWidth: 1, borderColor: "#1e2535" },
  btnGhostText: { fontSize: 13, color: "#6b7a99", fontWeight: "600" },
});
