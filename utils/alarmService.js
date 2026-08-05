// alarmService.js
// Rewritten for React Native:
//   Capacitor LocalNotifications → expo-notifications
//   localStorage               → AsyncStorage
//   window.setInterval         → in-memory interval (no browser globals)

import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const SETTINGS_KEY = "fittracker.notificationSettings";
const ALARMS_KEY   = "fittracker.alarms";
const COUNTER_KEY  = "fittracker.alarmCounter";

const NIGERIA_TZ = "Africa/Lagos";

// ─── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  enabled: true, sound: true, vibrate: true,
  workout: true, water: true, meal: true,
};

export const defaultAlarms = [
  { type: "meal",    time: "08:00", title: "Breakfast Time! 🍳",  message: "Take your breakfast now. Choose a balanced Nigerian meal." },
  { type: "workout", time: "06:30", title: "Workout Time! 💪",    message: "Time for your morning workout. Let's get fit!" },
  { type: "water",   time: "09:00", title: "Stay Hydrated! 💧",   message: "Drink a glass of water to stay hydrated." },
  { type: "meal",    time: "12:00", title: "Lunch Time! 🍽️",     message: "Time for lunch. Check your meal suggestion." },
  { type: "water",   time: "15:00", title: "Hydration Break! 💧", message: "Drink water to maintain energy levels." },
  { type: "workout", time: "17:00", title: "Evening Workout! 🏃", message: "Time for your evening exercise routine." },
  { type: "meal",    time: "19:00", title: "Dinner Time! 🍲",     message: "Take dinner now and keep it balanced." },
  { type: "water",   time: "21:00", title: "Night Hydration! 💧", message: "Drink water before bedtime." },
];

// ─── In-memory state ───────────────────────────────────────────────────────────

let _alarms = [];
let _initialized = false;

// ─── Storage helpers ───────────────────────────────────────────────────────────

const safeGet = async (key, fallback) => {
  try {
    const v = await AsyncStorage.getItem(key);
    return v !== null ? JSON.parse(v) : fallback;
  } catch { return fallback; }
};

const safeSet = async (key, value) => {
  try { await AsyncStorage.setItem(key, JSON.stringify(value)); } catch {}
};

// ─── Counter ───────────────────────────────────────────────────────────────────

let _counter = 1000;

const loadCounter = async () => {
  _counter = await safeGet(COUNTER_KEY, 1000);
};

const nextId = async () => {
  _counter = _counter >= 2147483647 ? 1000 : _counter + 1;
  await safeSet(COUNTER_KEY, _counter);
  return _counter;
};

// ─── Normalizers ───────────────────────────────────────────────────────────────

const normalizeTime = (val) => {
  if (typeof val !== "string") return "08:00";
  const [h, m] = val.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return "08:00";
  if (h < 0 || h > 23 || m < 0 || m > 59) return "08:00";
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const normalizeAlarm = async (alarm, index = 0) => {
  const notificationId = Number.isInteger(alarm?.notificationId) && alarm.notificationId > 0
    ? alarm.notificationId
    : await nextId();

  return {
    id: alarm?.id ? String(alarm.id) : `alarm-${Date.now()}-${index}`,
    notificationId,
    type: ["workout", "water", "meal"].includes(alarm?.type) ? alarm.type : "meal",
    time: normalizeTime(alarm?.time),
    title: alarm?.title || `Reminder ${index + 1}`,
    message: alarm?.message || "",
    enabled: alarm?.enabled !== false,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    sound: alarm?.sound !== false,
    vibrate: alarm?.vibrate !== false,
  };
};

// ─── Load / save ───────────────────────────────────────────────────────────────

const loadAlarms = async () => {
  await loadCounter();
  const stored = await safeGet(ALARMS_KEY, []);
  if (!Array.isArray(stored) || stored.length === 0) return [];
  return Promise.all(stored.map((a, i) => normalizeAlarm(a, i)));
};

const saveAlarms = async () => {
  await safeSet(ALARMS_KEY, _alarms);
};

// ─── Ensure initialized ────────────────────────────────────────────────────────

const ensureInit = async () => {
  if (_initialized) return;
  _alarms = await loadAlarms();
  _initialized = true;
};

// ─── Expo Notifications integration ───────────────────────────────────────────

// Configure handler once at module level
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const scheduleOneAlarm = async (alarm) => {
  const [hourStr, minStr] = alarm.time.split(":");
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: `alarm-${alarm.id}`,
      content: {
        title: alarm.title,
        body: alarm.message,
        sound: alarm.sound ? "default" : null,
      },
      trigger: {
        hour: Number(hourStr),
        minute: Number(minStr),
        repeats: true,
      },
    });
  } catch (e) {
    console.warn("Could not schedule alarm:", alarm.title, e);
  }
};

const cancelOneAlarm = async (alarmId) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(`alarm-${alarmId}`);
  } catch {}
};

const syncAllAlarms = async () => {
  const settings = await getNotificationSettings();
  if (!settings.enabled) {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return;
  }
  // Cancel all first, then reschedule enabled ones
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const alarm of _alarms) {
    if (alarm.enabled && settings[alarm.type] !== false) {
      await scheduleOneAlarm(alarm);
    }
  }
};

// ─── Public API ────────────────────────────────────────────────────────────────

export const getAllAlarms = () => _alarms.map((a) => ({ ...a }));

export const getNotificationSettings = async () => {
  const stored = await safeGet(SETTINGS_KEY, null);
  return stored ? { ...DEFAULT_SETTINGS, ...stored } : { ...DEFAULT_SETTINGS };
};

// Sync version for components that stored settings in memory (ReminderPanel, NotificationSettings)
export const getNotificationSettingsSync = () => {
  // Returns defaults — components should use getNotificationSettings() for persisted values
  return { ...DEFAULT_SETTINGS };
};

export const getNotificationStatus = async () => {
  const { status } = await Notifications.getPermissionsAsync();
  return {
    display: status,
    exact_alarm: Platform.OS === "android" ? status : "n/a",
  };
};

export const requestNotificationPermission = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status === "granted") await syncAllAlarms();
  return status === "granted";
};

// Android-only exact alarm — on expo-notifications this is handled automatically
export const requestExactNotificationPermission = async () => {
  if (Platform.OS !== "android") return "n/a";
  return requestNotificationPermission();
};

export const updateNotificationSettings = async (updates) => {
  const current = await getNotificationSettings();
  const next = { ...current, ...updates };
  await safeSet(SETTINGS_KEY, next);
  await syncAllAlarms();
  return next;
};

export const resetNotificationSettings = async () => {
  await safeSet(SETTINGS_KEY, DEFAULT_SETTINGS);
  await syncAllAlarms();
  return { ...DEFAULT_SETTINGS };
};

export const initializeDefaultAlarms = async () => {
  await ensureInit();
  if (_alarms.length > 0) return _alarms;
  for (let i = 0; i < defaultAlarms.length; i++) {
    _alarms.push(await normalizeAlarm(defaultAlarms[i], i));
  }
  await saveAlarms();
  await syncAllAlarms();
  return _alarms;
};

export const createAlarm = async (config) => {
  await ensureInit();
  const alarm = await normalizeAlarm(config, _alarms.length);
  const idx = _alarms.findIndex((a) => a.id === alarm.id);
  if (idx === -1) _alarms.push(alarm);
  else _alarms[idx] = alarm;
  await saveAlarms();
  await syncAllAlarms();
  return alarm;
};

export const updateAlarm = async (alarmId, updates) => {
  await ensureInit();
  const idx = _alarms.findIndex((a) => String(a.id) === String(alarmId));
  if (idx === -1) return undefined;
  _alarms[idx] = await normalizeAlarm({ ..._alarms[idx], ...updates }, idx);
  await saveAlarms();
  await syncAllAlarms();
  return _alarms[idx];
};

export const deleteAlarm = async (alarmId) => {
  await ensureInit();
  const idx = _alarms.findIndex((a) => String(a.id) === String(alarmId));
  if (idx === -1) return false;
  await cancelOneAlarm(alarmId);
  _alarms.splice(idx, 1);
  await saveAlarms();
  return true;
};

export const toggleAlarm = async (alarmId) => {
  await ensureInit();
  const idx = _alarms.findIndex((a) => String(a.id) === String(alarmId));
  if (idx === -1) return undefined;
  _alarms[idx] = { ..._alarms[idx], enabled: !_alarms[idx].enabled };
  await saveAlarms();
  if (_alarms[idx].enabled) await scheduleOneAlarm(_alarms[idx]);
  else await cancelOneAlarm(alarmId);
  return _alarms[idx];
};

// Boot — load from storage on import
(async () => { await ensureInit(); })();
