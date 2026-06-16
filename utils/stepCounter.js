// Step Counter and Activity Tracking
// Converted from localStorage → AsyncStorage for React Native
// Real step tracking uses expo-sensors Pedometer when available

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Pedometer } from "expo-sensors";

// ─── Storage helpers ───────────────────────────────────────────────────────────

const storageGet = async (key, fallback = "0") => {
  try {
    const val = await AsyncStorage.getItem(key);
    return val !== null ? val : fallback;
  } catch { return fallback; }
};

const storageSet = async (key, value) => {
  try { await AsyncStorage.setItem(key, String(value)); } catch {}
};

const STEP_TRACKING_ENABLED_KEY = "stepTrackingEnabled";

export const getStepTrackingEnabled = async () => {
  const stored = await storageGet(STEP_TRACKING_ENABLED_KEY, "true");
  return stored === "true";
};

export const setStepTrackingEnabled = async (enabled) => {
  await storageSet(STEP_TRACKING_ENABLED_KEY, enabled ? "true" : "false");
};

export const syncStepTracking = async () => {
  const enabled = await getStepTrackingEnabled();
  if (!enabled) {
    stopStepTracking();
    return;
  }
  if (_pedometerSubscription || _simulationInterval) return;
  await initializeStepTracking();
  await startStepTracking();
};

// ─── Date helpers ──────────────────────────────────────────────────────────────

const todayKey = () => new Date().toISOString().split("T")[0];

const getWeekDates = () => {
  const dates = [];
  const today = new Date();
  const dayOfWeek = today.getDay();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - dayOfWeek + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
};

const getMonthDates = () => {
  const dates = [];
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
};

// ─── In-memory state ───────────────────────────────────────────────────────────

let _dailySteps = 0;
let _pedometerSubscription = null;
let _simulationInterval = null;
let _watchBaseSteps = 0;

// ─── Init ──────────────────────────────────────────────────────────────────────

export const initializeStepTracking = async () => {
  const stored = await storageGet(`steps_${todayKey()}`, "0");
  _dailySteps = parseInt(stored);
  _watchBaseSteps = _dailySteps;
};

// ─── Real pedometer (physical device) ─────────────────────────────────────────

const startPedometer = async () => {
  const { granted } = await Pedometer.requestPermissionsAsync();
  if (!granted) return false;

  // Get steps since midnight for today's baseline
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();

  _watchBaseSteps = _dailySteps;
  try {
    const result = await Pedometer.getStepCountAsync(start, end);
    if (result && Number.isFinite(result.steps)) {
      _dailySteps = result.steps;
      _watchBaseSteps = _dailySteps;
    }
    await storageSet(`steps_${todayKey()}`, _dailySteps);
  } catch {}

  _pedometerSubscription = Pedometer.watchStepCount((result) => {
    _dailySteps = _watchBaseSteps + (result?.steps || 0);
    storageSet(`steps_${todayKey()}`, _dailySteps);
  });

  return true;
};

// ─── Start tracking ────────────────────────────────────────────────────────────

export const startStepTracking = async () => {
  const enabled = await getStepTrackingEnabled();
  if (!enabled) return null;
  if (_pedometerSubscription || _simulationInterval) return null;

  const isAvailable = await Pedometer.isAvailableAsync().catch(() => false);

  if (isAvailable) {
    await startPedometer();
    return null; // subscription managed internally
  }

  // Fallback: simulate steps for emulator / web
  console.log("📊 Step tracking started (simulated)");
  _simulationInterval = setInterval(() => {
    if (Math.random() > 0.95) recordStep();
  }, 1000);

  return _simulationInterval;
};

// ─── Stop tracking ─────────────────────────────────────────────────────────────

export const stopStepTracking = (intervalId) => {
  if (_pedometerSubscription) {
    _pedometerSubscription.remove();
    _pedometerSubscription = null;
  }
  if (_simulationInterval) {
    clearInterval(_simulationInterval);
    _simulationInterval = null;
  }
  if (intervalId) clearInterval(intervalId);
};

// ─── Record / add steps ────────────────────────────────────────────────────────

const recordStep = async () => {
  _dailySteps++;
  await storageSet(`steps_${todayKey()}`, _dailySteps);
};

export const addSteps = async (count) => {
  _dailySteps += count;
  await storageSet(`steps_${todayKey()}`, _dailySteps);
};

// ─── Getters ───────────────────────────────────────────────────────────────────

export const getDailySteps = () => _dailySteps;

export const getWeeklySteps = async () => {
  let total = 0;
  for (const date of getWeekDates()) {
    total += parseInt(await storageGet(`steps_${date}`, "0"));
  }
  return total;
};

export const getMonthlySteps = async () => {
  let total = 0;
  for (const date of getMonthDates()) {
    total += parseInt(await storageGet(`steps_${date}`, "0"));
  }
  return total;
};

// ─── Activity helpers (no async needed — pure logic) ──────────────────────────

export const getActivityLevel = (steps) => {
  if (steps < 5000)  return { level: "Sedentary",     color: "red",        emoji: "🛏️" };
  if (steps < 7500)  return { level: "Low Activity",  color: "orange",     emoji: "🚶" };
  if (steps < 10000) return { level: "Moderate",      color: "yellow",     emoji: "🚴" };
  if (steps < 12500) return { level: "Active",        color: "lightgreen", emoji: "🏃" };
  return               { level: "Very Active",  color: "green",      emoji: "⚡" };
};

export const getStepGoal = (fitnessLevel) => {
  const goals = { beginner: 5000, intermediate: 8000, advanced: 12000, athlete: 15000 };
  return goals[fitnessLevel] || 10000;
};

export const calculateCaloriesBurned = (steps, weight = 70) =>
  Math.round(steps * 0.04 * (weight / 70));

// ─── Stats ─────────────────────────────────────────────────────────────────────

export const getDailyStepStats = async () => {
  const steps = parseInt(await storageGet(`steps_${todayKey()}`, "0"));
  const goal = 10000;
  return {
    today: todayKey(),
    steps,
    goal,
    percentage: Math.min((steps / goal) * 100, 100),
    caloriesBurned: calculateCaloriesBurned(steps),
    activity: getActivityLevel(steps),
    remaining: Math.max(goal - steps, 0),
  };
};

export const getWeeklyStepStats = async () => {
  const week = getWeekDates();
  const stats = await Promise.all(
    week.map(async (date) => ({
      date,
      steps: parseInt(await storageGet(`steps_${date}`, "0")),
      dayName: new Date(date).toLocaleDateString("en-NG", { weekday: "short" }),
    }))
  );
  const total = stats.reduce((s, d) => s + d.steps, 0);
  return {
    week,
    stats,
    total,
    average: Math.round(total / 7),
    highestDay: stats.reduce((max, d) => (d.steps > max.steps ? d : max)),
  };
};

export const resetDailySteps = async () => {
  await AsyncStorage.removeItem(`steps_${todayKey()}`);
  _dailySteps = 0;
};
