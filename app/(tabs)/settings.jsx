import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, Switch, Alert, Platform, ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { getStepTrackingEnabled, setStepTrackingEnabled, syncStepTracking } from "../../utils/stepCounter";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";
import {
  cancelAllScheduledReminders,
  cancelReminderNotifications,
  getNotificationPermissionStatus,
  requestNotificationPermission,
  scheduleReminderNotification,
  sendTestReminderNotification,
} from "../../utils/notificationService";

const REMINDER_TIMES = [
  { id: "breakfast", label: "Breakfast Reminder", time: "07:30", emoji: "🍳" },
  { id: "lunch", label: "Lunch Reminder", time: "12:00", emoji: "🍛" },
  { id: "dinner", label: "Dinner Reminder", time: "19:00", emoji: "🍲" },
  { id: "water", label: "Water Reminder", time: "Every 2hrs", emoji: "💧" },
  { id: "workout", label: "Workout Reminder", time: "06:00", emoji: "💪" },
];

export default function Settings() {
  const { theme, mode, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState({});
  const [stepTrackingEnabled, setStepTrackingEnabledState] = useState(true);
  const [checking, setChecking] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [exporting, setExporting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkPermissions();
    loadStepTrackingSetting();
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    if (!user?.id) return;
    try {
      const checkRes = await API.get(`/subscriptions/user/${user.id}/check`);
      const checkData = checkRes?.data;
      const hasAccess = checkData?.active === true || checkData?.isActive === true || checkData?.hasAccess === true;

      if (!hasAccess) {
        setSubscription(null);
        return;
      }

      try {
        const accessRes = await API.get(`/subscriptions/user/${user.id}/access`);
        setSubscription(accessRes.data);
      } catch (accessError) {
        const status = accessError?.response?.status;
        if (status === 400 || status === 404) {
          setSubscription(null);
        } else {
          setSubscription(checkData);
        }
      }
    } catch (error) {
      const status = error?.response?.status;
      if (status === 400 || status === 404) {
        setSubscription(null);
      } else {
        setSubscription(null);
      }
    }
  };

  const loadStepTrackingSetting = async () => {
    const enabled = await getStepTrackingEnabled();
    setStepTrackingEnabledState(enabled);
  };

  const checkPermissions = async () => {
    const status = await getNotificationPermissionStatus();
    setPermissionGranted(status === "granted");
    setChecking(false);
  };

  const requestPermissions = async () => {
    const granted = await requestNotificationPermission();
    setPermissionGranted(granted);
    if (!granted) {
      Alert.alert(
        "Permission Required",
        "Please enable notifications in your device settings to use reminders.",
        [{ text: "OK" }]
      );
    }
    return granted;
  };

  const ensureNotificationsReady = async () => {
    if (permissionGranted) return true;
    const status = await getNotificationPermissionStatus();
    if (status === "granted") {
      setPermissionGranted(true);
      return true;
    }
    return requestPermissions();
  };

  const scheduleReminder = async (id, label, hour, minute) => {
    try {
      await scheduleReminderNotification({
        id,
        title: `KenntyFit — ${label}`,
        body: `Time for your ${label.toLowerCase()}! Stay on track.`,
        hour,
        minute,
        repeats: true,
      });
      return true;
    } catch (e) {
      console.error("[Reminder] Could not schedule reminder", e);
      Alert.alert(
        "Could not schedule reminder",
        e?.message || "Please check notification permissions and try again."
      );
      return false;
    }
  };

  const toggleReminder = async (reminder) => {
    const hasPermission = await ensureNotificationsReady();
    if (!hasPermission) return;

    const isEnabled = remindersEnabled[reminder.id];
    if (isEnabled) {
      await cancelReminderNotifications(reminder.id);
      setRemindersEnabled((p) => ({ ...p, [reminder.id]: false }));
      Alert.alert("Reminder Off", `${reminder.label} turned off.`);
      return;
    }

    let scheduled = false;
    const parts = reminder.time.split(":");
    if (parts.length === 2) {
      const hour = parseInt(parts[0], 10);
      const minute = parseInt(parts[1], 10);
      scheduled = await scheduleReminder(reminder.id, reminder.label, hour, minute);
    } else {
      for (let h = 8; h <= 20; h += 2) {
        const ok = await scheduleReminder(`${reminder.id}_${h}`, reminder.label, h, 0);
        if (!ok) {
          scheduled = false;
          break;
        }
        scheduled = true;
      }
      if (scheduled) {
        Alert.alert("Water Reminders Set ✅", "You'll be reminded every 2 hours from 8am to 8pm.");
      }
    }

    if (scheduled) {
      setRemindersEnabled((p) => ({ ...p, [reminder.id]: true }));
    }
  };

  const sendTestNotification = async () => {
    if (!permissionGranted) { await requestPermissions(); return; }
    await sendTestReminderNotification({
      title: "KenntyFit Test 🎉",
      body: "Notifications are working correctly!",
      seconds: 2,
    });
    Alert.alert("Test Sent", "You'll receive a notification in 2 seconds.");
  };

  const toggleStepTracking = async () => {
    const nextValue = !stepTrackingEnabled;
    await setStepTrackingEnabled(nextValue);
    setStepTrackingEnabledState(nextValue);
    if (!nextValue) {
      await syncStepTracking();
      Alert.alert("Step Tracking Disabled", "Step counting has been turned off.");
    } else {
      await syncStepTracking();
      Alert.alert("Step Tracking Enabled", "Step counting is now active when the app is active.");
    }
  };

  const cancelAllReminders = async () => {
    Alert.alert("Cancel All Reminders", "This will cancel all scheduled notifications.", [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", style: "destructive", onPress: async () => {
        await cancelAllScheduledReminders();
        setRemindersEnabled({});
        Alert.alert("Done", "All reminders cancelled.");
      }},
    ]);
  };

  const exportData = async () => {
    if (!user?.id) return;

    // Check if user has annual subscription
    if (subscription?.plan !== "ANNUAL" || !subscription?.hasAccess) {
      Alert.alert(
        "Annual Plan Required",
        "Data export is available exclusively for Annual subscribers. Upgrade your plan to access this feature.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "View Plans", onPress: () => router.push("/pricing") },
        ]
      );
      return;
    }

    setExporting(true);
    try {
      // Fetch CSV from backend as text
      const response = await API.get(`/export/user/${user.id}/annual`, {
        responseType: "text",
      });

      const csvContent = response.data;
      const year = new Date().getFullYear();
      const filename = `kennyfit_export_${user.username || user.id}_${year}.csv`;
      const fileUri = FileSystem.documentDirectory + filename;

      // Write to device storage
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Share/download the file
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/csv",
          dialogTitle: "Save your KennyFit data export",
          UTI: "public.comma-separated-values-text",
        });
      } else {
        Alert.alert("Exported", `Your data has been saved to:\n${fileUri}`);
      }
    } catch (err) {
      const msg = err?.response?.status === 403
        ? "Annual subscription required to export data."
        : "Could not export data. Please try again.";
      Alert.alert("Export Failed", msg);
    } finally {
      setExporting(false);
    }
  };

  const isAnnualSubscriber = subscription?.plan === "ANNUAL" && subscription?.hasAccess;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.text }]}>Settings ⚙️</Text>
        <Text style={[styles.sub, { color: theme.muted }]}>Notifications and reminder controls</Text>

        {/* Permission status */}
        <View style={[styles.permCard, { borderColor: permissionGranted ? "rgba(0,229,160,0.3)" : "rgba(251,191,36,0.3)", backgroundColor: theme.surface }]}>
          <View style={styles.permRow}>
            <Text style={styles.permEmoji}>{permissionGranted ? "✅" : "⚠️"}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.permTitle, { color: theme.text }]}>Notification Permission</Text>
              <Text style={[styles.permStatus, { color: theme.muted }]}>
                {permissionGranted ? "Granted — reminders will work" : "Not granted — tap to enable"}
              </Text>
            </View>
            {!permissionGranted && (
              <TouchableOpacity style={[styles.grantBtn, { backgroundColor: theme.accent }]} onPress={requestPermissions}>
                <Text style={[styles.grantBtnText, { color: theme.accentText }]}>Enable</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Theme */}
        <Text style={[styles.sectionTitle, { color: theme.muted }]}>Theme</Text>
        <View style={[styles.themeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.themeLabel, { color: theme.text }]}>App appearance</Text>
          <View style={styles.themeRow}>
            <Text style={[styles.themeText, { color: theme.text }]}>Use {mode === "dark" ? "Dark" : "Light"} Mode</Text>
            <Switch
              value={mode === "dark"}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.border, true: theme.accent }}
              thumbColor={mode === "dark" ? theme.accentText : theme.surface}
            />
          </View>
        </View>

        {/* Step Counter */}
        <Text style={[styles.sectionTitle, { color: theme.muted }]}>Step Counter</Text>
        <View style={[styles.remindersCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.reminderRow}>
            <Text style={styles.reminderEmoji}>👣</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.reminderLabel, { color: theme.text }]}>Enable Step Tracking</Text>
              <Text style={[styles.reminderTime, { color: theme.muted }]}>
                {stepTrackingEnabled ? "Counting steps when active" : "Step counting is paused"}
              </Text>
            </View>
            <Switch
              value={stepTrackingEnabled}
              onValueChange={toggleStepTracking}
              trackColor={{ false: theme.border, true: theme.accent }}
              thumbColor={stepTrackingEnabled ? theme.accentText : theme.placeholder}
            />
          </View>
        </View>

        {/* Reminders */}
        <Text style={[styles.sectionTitle, { color: theme.muted }]}>Daily Reminders</Text>
        <View style={[styles.remindersCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {REMINDER_TIMES.map((reminder, i) => (
            <View key={reminder.id} style={[styles.reminderRow, i < REMINDER_TIMES.length - 1 && styles.reminderBorder]}>
              <Text style={styles.reminderEmoji}>{reminder.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.reminderLabel, { color: theme.text }]}>{reminder.label}</Text>
                <Text style={[styles.reminderTime, { color: theme.muted }]}>{reminder.time}</Text>
              </View>
              <Switch
                value={!!remindersEnabled[reminder.id]}
                onValueChange={() => toggleReminder(reminder)}
                trackColor={{ false: theme.border, true: theme.accent }}
                thumbColor={remindersEnabled[reminder.id] ? theme.accentText : theme.placeholder}
              />
            </View>
          ))}
        </View>

        {/* Actions */}
        <Text style={[styles.sectionTitle, { color: theme.muted }]}>Actions</Text>
        <View style={[styles.actionsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TouchableOpacity style={styles.actionRow} onPress={() => router.push("/profile")}>
            <Text style={styles.actionEmoji}>👤</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionLabel, { color: theme.text }]}>My Profile</Text>
              <Text style={[styles.actionSub, { color: theme.muted }]}>View and edit your profile</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.actionBorder} />
          <TouchableOpacity style={styles.actionRow} onPress={() => router.push("/pricing")}>
            <Text style={styles.actionEmoji}>💳</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionLabel, { color: theme.text }]}>Subscription Plans</Text>
              <Text style={[styles.actionSub, { color: theme.muted }]}>View and manage your subscription</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.actionBorder} />

          {/* Export Data — annual subscribers only */}
          <TouchableOpacity
            style={[styles.actionRow, !isAnnualSubscriber && { opacity: 0.6 }]}
            onPress={exportData}
            disabled={exporting}
          >
            <Text style={styles.actionEmoji}>📤</Text>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={[styles.actionLabel, { color: theme.text }]}>Export My Data</Text>
                {!isAnnualSubscriber && (
                  <View style={[styles.planBadge, { backgroundColor: theme.accent + "22", borderColor: theme.accent + "55" }]}>
                    <Text style={[styles.planBadgeText, { color: theme.accent }]}>Annual</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.actionSub, { color: theme.muted }]}>
                {isAnnualSubscriber
                  ? `Download CSV of your ${new Date().getFullYear()} data`
                  : "Available on Annual plan only"}
              </Text>
            </View>
            {exporting
              ? <ActivityIndicator size="small" color={theme.accent} />
              : <Text style={styles.actionArrow}>›</Text>}
          </TouchableOpacity>

          <View style={styles.actionBorder} />
          <TouchableOpacity style={styles.actionRow} onPress={cancelAllReminders}>
            <Text style={styles.actionEmoji}>🗑️</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionLabel, { color: theme.danger }]}>Cancel All Reminders</Text>
              <Text style={[styles.actionSub, { color: theme.muted }]}>Remove all scheduled notifications</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.infoTitle, { color: theme.text }]}>ℹ️ About Notifications</Text>
          <Text style={[styles.infoText, { color: theme.muted }]}>
            Reminders are handled natively by your {Platform.OS === "ios" ? "iPhone" : "Android device"}.
            They will still fire even when the app is closed. You can manage them anytime from your device settings.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0e1a" },
  container: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "800", color: "#fff", marginBottom: 4 },
  sub: { fontSize: 13, color: "#6b7a99", marginBottom: 20 },
  permCard: { backgroundColor: "#111827", borderRadius: 12, padding: 14, marginBottom: 24, borderWidth: 1 },
  themeCard: { borderRadius: 12, padding: 14, marginBottom: 24, borderWidth: 1 },
  themeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  themeLabel: { fontSize: 14, fontWeight: "700", marginBottom: 8 },
  themeText: { fontSize: 13, fontWeight: "600" },
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
  planBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1 },
  planBadgeText: { fontSize: 9, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  infoCard: { backgroundColor: "#111827", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#1e2535" },
  infoTitle: { fontSize: 13, fontWeight: "700", color: "#fff", marginBottom: 8 },
  infoText: { fontSize: 12, color: "#6b7a99", lineHeight: 18 },
});
