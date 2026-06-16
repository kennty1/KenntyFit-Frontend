import React, { useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Switch, Alert,
} from "react-native";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DEFAULT_ALARMS = [
  { id: "breakfast", type: "meal",    title: "Breakfast Time",   message: "Time for your morning meal 🍳", time: "07:30", hour: 7,  minute: 30, enabled: true },
  { id: "lunch",     type: "meal",    title: "Lunch Time",       message: "Time for lunch 🍛",             time: "12:00", hour: 12, minute: 0,  enabled: true },
  { id: "dinner",    type: "meal",    title: "Dinner Time",      message: "Time for dinner 🍲",            time: "19:00", hour: 19, minute: 0,  enabled: true },
  { id: "water_am",  type: "water",   title: "Hydration Check",  message: "Drink some water 💧",           time: "09:00", hour: 9,  minute: 0,  enabled: true },
  { id: "water_pm",  type: "water",   title: "Hydration Check",  message: "Stay hydrated 💧",              time: "15:00", hour: 15, minute: 0,  enabled: true },
  { id: "workout",   type: "workout", title: "Workout Reminder", message: "Time to exercise 💪",           time: "06:30", hour: 6,  minute: 30, enabled: false },
];

const TYPE_META = {
  meal:    { label: "Meals",    icon: "🍽️" },
  water:   { label: "Water",    icon: "💧" },
  workout: { label: "Workouts", icon: "🏋️" },
};

const STORAGE_KEY = "kenntyfit_alarms";

export default function ReminderPanel({ title = "Alarms", readOnly = false }) {
  const router = useRouter();
  const [alarms, setAlarms] = useState(DEFAULT_ALARMS);
  const [permGranted, setPermGranted] = useState(false);

  useEffect(() => {
    loadAlarms();
    checkPermission();
  }, []);

  const checkPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermGranted(status === "granted");
  };

  const loadAlarms = async () => {
    const stored = await AsyncStorage.getItem(STORAGE_KEY).catch(() => null);
    if (stored) setAlarms(JSON.parse(stored));
  };

  const saveAlarms = async (updated) => {
    setAlarms(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const requestPerm = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setPermGranted(status === "granted");
    if (status !== "granted") {
      Alert.alert("Permission needed", "Enable notifications in your device settings to use reminders.");
    }
    return status === "granted";
  };

  const scheduleAlarm = async (alarm) => {
    await Notifications.scheduleNotificationAsync({
      content: { title: alarm.title, body: alarm.message, sound: true },
      trigger: { hour: alarm.hour, minute: alarm.minute, repeats: true },
    });
  };

  const cancelAlarm = async (id) => {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of scheduled) {
      if (n.content.title?.includes(id)) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }
  };

  const handleToggle = async (alarmId) => {
    if (!permGranted) {
      const granted = await requestPerm();
      if (!granted) return;
    }
    const updated = alarms.map((a) => {
      if (a.id !== alarmId) return a;
      const next = { ...a, enabled: !a.enabled };
      if (next.enabled) scheduleAlarm(next);
      else cancelAlarm(alarmId);
      return next;
    });
    await saveAlarms(updated);
  };

  const enableAll = async () => {
    if (!permGranted) {
      const granted = await requestPerm();
      if (!granted) return;
    }
    const updated = alarms.map((a) => { scheduleAlarm(a); return { ...a, enabled: true }; });
    await saveAlarms(updated);
  };

  // Group by type
  const grouped = alarms.reduce((acc, a) => {
    const k = a.type || "meal";
    if (!acc[k]) acc[k] = [];
    acc[k].push(a);
    return acc;
  }, {});

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSub}>Meal, water, and workout alerts on the device.</Text>
        </View>
        {readOnly ? (
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/settings")}>
            <Text style={styles.actionBtnText}>Manage</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.actionBtn} onPress={enableAll}>
            <Text style={styles.actionBtnText}>Enable All</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.permText}>
        Permission: <Text style={styles.permValue}>{permGranted ? "Granted ✓" : "Not granted"}</Text>
      </Text>

      {/* Grouped alarms */}
      {Object.entries(TYPE_META).map(([type, meta]) => {
        const items = grouped[type] || [];
        return (
          <View key={type} style={styles.group}>
            <View style={styles.groupHeader}>
              <Text style={styles.groupIcon}>{meta.icon}</Text>
              <Text style={styles.groupLabel}>{meta.label}</Text>
              <Text style={styles.groupCount}>{items.length} alert(s)</Text>
            </View>
            {items.map((alarm) => (
              <View key={alarm.id} style={styles.alarmRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.alarmTitle}>{alarm.title}</Text>
                  <Text style={styles.alarmMsg}>{alarm.message}</Text>
                  <Text style={styles.alarmTime}>At {alarm.time}</Text>
                </View>
                {!readOnly && (
                  <Switch
                    value={alarm.enabled}
                    onValueChange={() => handleToggle(alarm.id)}
                    trackColor={{ false: "#1e2535", true: "#00e5a0" }}
                    thumbColor={alarm.enabled ? "#0a0e1a" : "#6b7a99"}
                  />
                )}
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#111827", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#1e2535" },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#fff" },
  cardSub: { fontSize: 12, color: "#6b7a99", marginTop: 3 },
  actionBtn: { backgroundColor: "#00e5a0", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  actionBtnText: { fontSize: 12, fontWeight: "700", color: "#0a0e1a" },
  permText: { fontSize: 12, color: "#6b7a99", marginBottom: 14 },
  permValue: { color: "#fff", fontWeight: "600" },
  group: { backgroundColor: "#0d1526", borderRadius: 8, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: "#1e2535" },
  groupHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  groupIcon: { fontSize: 16 },
  groupLabel: { fontSize: 14, fontWeight: "700", color: "#fff", flex: 1 },
  groupCount: { fontSize: 11, color: "#6b7a99" },
  alarmRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  alarmTitle: { fontSize: 13, fontWeight: "600", color: "#fff" },
  alarmMsg: { fontSize: 11, color: "#6b7a99" },
  alarmTime: { fontSize: 11, color: "#6b7a99" },
});
