import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, Switch, Alert, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const REMINDER_TIMES = [
  { id: "breakfast", label: "Breakfast Reminder", time: "07:30", emoji: "🍳" },
  { id: "lunch", label: "Lunch Reminder", time: "12:00", emoji: "🍛" },
  { id: "dinner", label: "Dinner Reminder", time: "19:00", emoji: "🍲" },
  { id: "water", label: "Water Reminder", time: "Every 2hrs", emoji: "💧" },
  { id: "workout", label: "Workout Reminder", time: "06:00", emoji: "💪" },
];

export default function Settings() {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState({});
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkPermissions();
  }, []);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  const checkPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionGranted(status === "granted");
    setChecking(false);
  };

  const requestPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setPermissionGranted(status === "granted");
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please enable notifications in your device settings to use reminders.",
        [{ text: "OK" }]
      );
    }
  };

  const scheduleReminder = async (id, label, hour, minute) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `KenntyFit — ${label}`,
          body: `Time for your ${label.toLowerCase()}! Stay on track.`,
          sound: true,
        },
        trigger: {
          hour,
          minute,
          repeats: true,
        },
      });
      Alert.alert("Reminder Set ✅", `${label} scheduled daily.`);
    } catch (e) {
      Alert.alert("Error", "Could not schedule reminder.");
    }
  };

  const toggleReminder = async (reminder) => {
    if (!permissionGranted) { await requestPermissions(); return; }
    const isEnabled = remindersEnabled[reminder.id];
    if (isEnabled) {
      setRemindersEnabled((p) => ({ ...p, [reminder.id]: false }));
      Alert.alert("Reminder Off", `${reminder.label} turned off.`);
    } else {
      // Parse time if available
      const parts = reminder.time.split(":");
      if (parts.length === 2) {
        const hour = parseInt(parts[0]);
        const minute = parseInt(parts[1]);
        await scheduleReminder(reminder.id, reminder.label, hour, minute);
      } else {
        // Water reminder — schedule every 2 hours
        for (let h = 8; h <= 20; h += 2) {
          await scheduleReminder(`${reminder.id}_${h}`, reminder.label, h, 0);
        }
        Alert.alert("Water Reminders Set ✅", "You'll be reminded every 2 hours from 8am to 8pm.");
      }
      setRemindersEnabled((p) => ({ ...p, [reminder.id]: true }));
    }
  };

  const sendTestNotification = async () => {
    if (!permissionGranted) { await requestPermissions(); return; }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "KenntyFit Test 🎉",
        body: "Notifications are working correctly!",
        sound: true,
      },
      trigger: { seconds: 2 },
    });
    Alert.alert("Test Sent", "You'll receive a notification in 2 seconds.");
  };

  const cancelAllReminders = async () => {
    Alert.alert("Cancel All Reminders", "This will cancel all scheduled notifications.", [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", style: "destructive", onPress: async () => {
        await Notifications.cancelAllScheduledNotificationsAsync();
        setRemindersEnabled({});
        Alert.alert("Done", "All reminders cancelled.");
      }},
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <MaterialCommunityIcons name="chevron-left" size={24} color="#00e5a0" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Settings ⚙️</Text>
        <Text style={styles.sub}>Notifications and reminder controls</Text>

        {/* Permission status */}
        <View style={[styles.permCard, { borderColor: permissionGranted ? "rgba(0,229,160,0.3)" : "rgba(251,191,36,0.3)" }]}>
          <View style={styles.permRow}>
            <Text style={styles.permEmoji}>{permissionGranted ? "✅" : "⚠️"}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.permTitle}>Notification Permission</Text>
              <Text style={styles.permStatus}>
                {permissionGranted ? "Granted — reminders will work" : "Not granted — tap to enable"}
              </Text>
            </View>
            {!permissionGranted && (
              <TouchableOpacity style={styles.grantBtn} onPress={requestPermissions}>
                <Text style={styles.grantBtnText}>Enable</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Reminders */}
        <Text style={styles.sectionTitle}>Daily Reminders</Text>
        <View style={styles.remindersCard}>
          {REMINDER_TIMES.map((reminder, i) => (
            <View key={reminder.id} style={[styles.reminderRow, i < REMINDER_TIMES.length - 1 && styles.reminderBorder]}>
              <Text style={styles.reminderEmoji}>{reminder.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.reminderLabel}>{reminder.label}</Text>
                <Text style={styles.reminderTime}>{reminder.time}</Text>
              </View>
              <Switch
                value={!!remindersEnabled[reminder.id]}
                onValueChange={() => toggleReminder(reminder)}
                trackColor={{ false: "#1e2535", true: "#00e5a0" }}
                thumbColor={remindersEnabled[reminder.id] ? "#0a0e1a" : "#6b7a99"}
              />
            </View>
          ))}
        </View>

        {/* Actions */}
        <Text style={styles.sectionTitle}>Actions</Text>
        <View style={styles.actionsCard}>
          <TouchableOpacity style={styles.actionRow} onPress={sendTestNotification}>
            <Text style={styles.actionEmoji}>🔔</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionLabel}>Send Test Notification</Text>
              <Text style={styles.actionSub}>Check if notifications are working</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.actionBorder} />
          <TouchableOpacity style={styles.actionRow} onPress={cancelAllReminders}>
            <Text style={styles.actionEmoji}>🗑️</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionLabel, { color: "#ff6b6b" }]}>Cancel All Reminders</Text>
              <Text style={styles.actionSub}>Remove all scheduled notifications</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>ℹ️ About Notifications</Text>
          <Text style={styles.infoText}>
            Reminders are handled natively by your {Platform.OS === "ios" ? "iPhone" : "Android device"}.
            Your Settings
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0e1a" },
  container: { padding: 20, paddingBottom: 40 },
  backBtn: { flexDirection: "row", alignItems: "center", marginBottom: 20, paddingVertical: 8 },
  backText: { fontSize: 16, fontWeight: "600", color: "#00e5a0", marginLeft: 4 },
  title: { fontSize: 24, fontWeight: "800", color: "#fff", marginBottom: 4 },
  sub: { fontSize: 13, color: "#6b7a99", marginBottom: 20 },
  permCard: { backgroundColor: "#111827", borderRadius: 12, padding: 14, marginBottom: 24, borderWidth: 1 },
  permRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  permEmoji: { fontSize: 24 },
  permTitle: { fontSize: 14, fontWeight: "700", color: "#fff", marginBottom: 2 },
  permStatus: { fontSize: 12, color: "#6b7a99" },
  grantBtn: { backgroundColor: "#fbbf24", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  grantBtnText: { fontSize: 12, fontWeight: "700", color: "#0a0e1a" },
  sectionTitle: { fontSize: 11, fontWeight: "700", color: "#6b7a99", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  remindersCard: { backgroundColor: "#111827", borderRadius: 14, overflow: "hidden", marginBottom: 24, borderWidth: 1, borderColor: "#1e2535" },
  reminderRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  reminderBorder: { borderBottomWidth: 1, borderBottomColor: "#1e2535" },
  reminderEmoji: { fontSize: 22, width: 30 },
  reminderLabel: { fontSize: 14, fontWeight: "600", color: "#fff", marginBottom: 2 },
  reminderTime: { fontSize: 11, color: "#6b7a99" },
  actionsCard: { backgroundColor: "#111827", borderRadius: 14, overflow: "hidden", marginBottom: 24, borderWidth: 1, borderColor: "#1e2535" },
  actionRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  actionBorder: { height: 1, backgroundColor: "#1e2535" },
  actionEmoji: { fontSize: 22, width: 30 },
  actionLabel: { fontSize: 14, fontWeight: "600", color: "#fff", marginBottom: 2 },
  actionSub: { fontSize: 11, color: "#6b7a99" },
  actionArrow: { fontSize: 20, color: "#6b7a99" },
  infoCard: { backgroundColor: "#111827", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#1e2535" },
  infoTitle: { fontSize: 13, fontWeight: "700", color: "#fff", marginBottom: 8 },
  infoText: { fontSize: 12, color: "#6b7a99", lineHeight: 18 },
});
