import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";
import WorkoutDemoPlayer from "../../components/WorkoutDemoPlayer";
import { calculateCaloriesBurned, getDailyStepStats } from "../../utils/stepCounter";
import {
  WORKOUT_GOAL_KEYS,
  getRecommendedWorkout,
  getWorkoutPlan,
  normalizeFitnessGoal,
} from "../../utils/workoutPrograms";

const todayKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatTime = (seconds) => {
  const total = Math.max(0, Math.floor(seconds || 0));
  const minutes = String(Math.floor(total / 60)).padStart(2, "0");
  const secs = String(total % 60).padStart(2, "0");
  return `${minutes}:${secs}`;
};

const formatLabel = (value) => String(value || "").replace(/_/g, " ").trim();

const intensityFromDifficulty = (difficulty) => {
  const value = String(difficulty || "").toLowerCase();
  if (value.includes("hard")) return "HIGH";
  if (value.includes("medium")) return "MODERATE";
  return "LOW";
};

const savedWorkoutDuration = (item) => {
  if (item?.durationSeconds !== undefined && item?.durationSeconds !== null) {
    return formatTime(item.durationSeconds);
  }
  if (item?.durationMinutes !== undefined && item?.durationMinutes !== null) {
    return formatTime(Number(item.durationMinutes || 0) * 60);
  }
  return "00:00";
};

const getApiErrorMessage = (error, fallback = "Could not save workout.") => {
  const serverMessage =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.title ||
    error?.message;
  return serverMessage ? String(serverMessage) : fallback;
};

export default function Workouts() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [selectedGoalKey, setSelectedGoalKey] = useState("IMPROVE_FITNESS");
  const [selectedRoutineId, setSelectedRoutineId] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [dailyStats, setDailyStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionStartSteps, setSessionStartSteps] = useState(0);
  const [sessionStartedAt, setSessionStartedAt] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const profileGoal = normalizeFitnessGoal(user?.fitnessGoal);
    setSelectedGoalKey(profileGoal);
    const recommended = getRecommendedWorkout(profileGoal, user?.activityLevel);
    setSelectedRoutineId(recommended?.id || null);
  }, [user?.id, user?.fitnessGoal, user?.activityLevel]);

  const activePlan = useMemo(() => getWorkoutPlan(selectedGoalKey), [selectedGoalKey]);
  const recommendedRoutine = useMemo(
    () => getRecommendedWorkout(selectedGoalKey, user?.activityLevel),
    [selectedGoalKey, user?.activityLevel]
  );
  const activeRoutine = useMemo(() => {
    return (
      activePlan.routines.find((routine) => routine.id === selectedRoutineId) ||
      recommendedRoutine ||
      activePlan.routines[0]
    );
  }, [activePlan.routines, recommendedRoutine, selectedRoutineId]);

  const sessionSteps = Math.max((dailyStats?.steps || 0) - sessionStartSteps, 0);
  const sessionMinutes = Math.max(1, Math.ceil(elapsedSeconds / 60));
  const estimatedCalories = Math.max(
    activeRoutine?.calories || 0,
    calculateCaloriesBurned(sessionSteps, Number(user?.weight || 70) || 70)
  );

  const loadWorkouts = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const res = await API.get(`/workouts/user/${user.id}/date/${todayKey()}`);
      setWorkouts(Array.isArray(res.data) ? res.data : []);
      setError("");
    } catch {
      setError("Could not load workouts.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  const loadDailyStats = useCallback(async () => {
    try {
      const stats = await getDailyStepStats();
      setDailyStats(stats);
    } catch {
      // Step tracking can fail on unsupported devices. Keep the last value.
    }
  }, []);

  useEffect(() => {
    void loadWorkouts();
    void loadDailyStats();
  }, [loadWorkouts, loadDailyStats]);

  useEffect(() => {
    if (!user?.id) {
      return undefined;
    }

    let active = true;
    const syncSteps = async () => {
      try {
        const stats = await getDailyStepStats();
        if (active) {
          setDailyStats(stats);
        }
      } catch {
        // Ignore sensor failures.
      }
    };

    void syncSteps();
    const intervalId = setInterval(syncSteps, 2000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!running) {
      return undefined;
    }

    const timerId = setInterval(() => {
      setElapsedSeconds((value) => value + 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [running]);

  const onRefresh = () => {
    setRefreshing(true);
    void loadWorkouts();
    void loadDailyStats();
  };

  const chooseGoal = (goalKey) => {
    if (running) {
      Alert.alert("Pause first", "Pause the timer before changing workout plans.");
      return;
    }

    const normalized = normalizeFitnessGoal(goalKey);
    setSelectedGoalKey(normalized);
    const recommended = getRecommendedWorkout(normalized, user?.activityLevel);
    setSelectedRoutineId(recommended?.id || null);
  };

  const chooseRoutine = (routineId) => {
    if (running) {
      Alert.alert("Pause first", "Pause the timer before switching routines.");
      return;
    }

    setSelectedRoutineId(routineId);
  };

  const startSession = () => {
    if (!user?.id) {
      Alert.alert("Sign in required", "Please sign in first.");
      return;
    }

    if (!running && elapsedSeconds === 0) {
      setSessionStartSteps(dailyStats?.steps || 0);
      setSessionStartedAt(new Date().toISOString());
    }

    setError("");
    setRunning(true);
  };

  const pauseSession = () => {
    setRunning(false);
  };

  const resetSession = () => {
    setRunning(false);
    setElapsedSeconds(0);
    setSessionStartSteps(dailyStats?.steps || 0);
    setSessionStartedAt(null);
    setError("");
  };

  const saveSession = async () => {
    if (!user?.id) {
      return;
    }

    if (elapsedSeconds <= 0) {
      Alert.alert("Start the timer", "Tap Start before saving the workout.");
      return;
    }

    setSaving(true);
    try {
      const completedAt = new Date().toISOString();
      const richPayload = {
        userId: user.id,
        workoutType: activeRoutine?.workoutType || "BALANCED",
        workoutName: activeRoutine?.name || "Workout",
        routineId: activeRoutine?.id,
        fitnessGoal: activePlan.key,
        fitnessGoalLabel: activePlan.label,
        videoUrl: activeRoutine?.videoUrl,
        durationMinutes: sessionMinutes,
        durationSeconds: elapsedSeconds,
        stepCount: sessionSteps,
        caloriesBurned: estimatedCalories,
        notes: `${activeRoutine?.name || "Workout"} guided session`,
        intensity: intensityFromDifficulty(activeRoutine?.difficulty),
        workoutDate: todayKey(),
        startedAt: sessionStartedAt,
        completedAt,
      };

      const fallbackPayload = {
        userId: user.id,
        workoutType: activeRoutine?.workoutType || "BALANCED",
        durationMinutes: sessionMinutes,
        stepCount: sessionSteps,
        caloriesBurned: estimatedCalories,
        notes: activeRoutine?.name || "Workout session",
        intensity: intensityFromDifficulty(activeRoutine?.difficulty),
        workoutDate: todayKey(),
      };

      try {
        await API.post(`/workouts/user/${user.id}/auto-track`, richPayload);
      } catch (firstError) {
        try {
          await API.post(`/workouts/user/${user.id}/auto-track`, fallbackPayload);
        } catch (secondError) {
          throw secondError;
        }
      }

      setRunning(false);
      setElapsedSeconds(0);
      setSessionStartSteps(dailyStats?.steps || 0);
      setSessionStartedAt(null);
      await loadWorkouts();
      Alert.alert("Workout saved", "Your workout time has been recorded.");
    } catch (error) {
      Alert.alert("Error", getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const deleteWorkout = (id) => {
    Alert.alert("Delete", "Remove this workout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await API.delete(`/workouts/${id}`);
            await loadWorkouts();
          } catch {
            Alert.alert("Error", "Could not delete.");
          }
        },
      },
    ]);
  };

  const activeRoutineIndex = activePlan.routines.findIndex((routine) => routine.id === activeRoutine?.id);
  const routineChoiceNumber = activeRoutineIndex >= 0 ? activeRoutineIndex + 1 : 1;

  const styles = useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.background },
    container: { padding: 20, paddingBottom: 40 },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    headerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
    title: { fontSize: 26, fontWeight: "800", color: theme.text },
    sub: { fontSize: 13, color: theme.muted, lineHeight: 19, marginTop: 4 },
    smallBtn: {
      backgroundColor: theme.surface,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: theme.border,
    },
    smallBtnText: { fontSize: 12, fontWeight: "700", color: theme.accent },
    alertWarn: {
      backgroundColor: "rgba(251,191,36,0.1)",
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: "rgba(251,191,36,0.3)",
    },
    alertText: { color: "#fbbf24", fontSize: 13, lineHeight: 18 },
    heroCard: {
      backgroundColor: theme.surface,
      borderRadius: 18,
      padding: 18,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 16,
    },
    heroEyebrow: {
      fontSize: 11,
      fontWeight: "800",
      color: theme.muted,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 6,
    },
    heroTitle: { fontSize: 24, fontWeight: "900", color: theme.text, marginBottom: 6 },
    heroCopy: { fontSize: 13, color: theme.muted, lineHeight: 20, marginBottom: 12 },
    badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    badge: {
      backgroundColor: theme.inputBackground,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: theme.border,
    },
    badgeText: { fontSize: 11, color: theme.muted, fontWeight: "700" },
    section: { marginBottom: 18 },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "800",
      color: theme.text,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 10,
    },
    goalRow: { gap: 10, paddingRight: 8 },
    goalCard: {
      width: 240,
      backgroundColor: theme.surface,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.border,
    },
    goalCardActive: {
      backgroundColor: theme.inputBackground,
    },
    goalName: { fontSize: 14, fontWeight: "800", color: theme.text, marginBottom: 6 },
    goalSub: { fontSize: 12, color: theme.muted, lineHeight: 17 },
    recommendCard: {
      backgroundColor: theme.surface,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.border,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    recommendTitle: { fontSize: 15, fontWeight: "800", color: theme.text, marginBottom: 4 },
    recommendSub: { fontSize: 12, color: theme.muted, lineHeight: 18 },
    recommendBtn: {
      backgroundColor: theme.accent,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    recommendBtnText: { fontSize: 13, fontWeight: "800", color: theme.accentText },
    routineCard: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 10,
    },
    routineCardActive: {
      borderColor: theme.accent,
      backgroundColor: theme.inputBackground,
    },
    routineTopRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
    routineIndex: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.background,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.border,
    },
    routineIndexText: { fontSize: 11, color: theme.muted, fontWeight: "700" },
    routineName: { fontSize: 15, fontWeight: "800", color: theme.text },
    routineSub: { fontSize: 12, color: theme.muted, marginTop: 3 },
    routineDescription: { fontSize: 13, color: theme.muted, lineHeight: 19, marginTop: 10 },
    routineMetaRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 },
    routineMetaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
    routineMeta: { fontSize: 12, color: theme.muted },
    instructionBox: {
      marginTop: 12,
      backgroundColor: theme.surface,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.border,
    },
    instructionTitle: { fontSize: 13, fontWeight: "800", color: theme.text, marginBottom: 8 },
    instructionItem: { fontSize: 13, color: theme.muted, lineHeight: 19, marginBottom: 6 },
    timerCard: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 18,
    },
    timerTitle: {
      fontSize: 13,
      fontWeight: "800",
      color: theme.text,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    timerValue: { fontSize: 42, fontWeight: "900", color: theme.accent, marginTop: 6 },
    timerSub: { fontSize: 12, color: theme.muted, marginTop: 6, marginBottom: 14 },
    buttonRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
    primaryBtn: {
      flex: 1,
      backgroundColor: theme.accent,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: "center",
    },
    primaryBtnText: { fontSize: 14, fontWeight: "800", color: theme.accentText },
    secondaryBtn: {
      flex: 1,
      backgroundColor: theme.inputBackground,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
    },
    secondaryBtnText: { fontSize: 14, fontWeight: "700", color: theme.muted },
    saveBtn: {
      backgroundColor: "#fbbf24",
      borderRadius: 10,
      paddingVertical: 13,
      alignItems: "center",
      marginBottom: 8,
    },
    saveBtnDisabled: { opacity: 0.7 },
    saveBtnText: { fontSize: 14, fontWeight: "800", color: "#0a0e1a" },
    helperText: { fontSize: 12, color: theme.muted, lineHeight: 18 },
    summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    summaryCard: {
      width: "48%",
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    summaryValue: { fontSize: 18, fontWeight: "900", color: theme.accent, marginBottom: 4 },
    summaryLabel: { fontSize: 10, color: theme.muted, textTransform: "uppercase" },
    emptyCard: {
      backgroundColor: theme.surface,
      borderRadius: 14,
      padding: 18,
      borderWidth: 1,
      borderColor: theme.border,
    },
    emptyTitle: { fontSize: 14, fontWeight: "800", color: theme.text, marginBottom: 6 },
    emptyText: { fontSize: 13, color: theme.muted, lineHeight: 18 },
    workoutCard: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: theme.border,
    },
    workoutHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
    workoutType: { fontSize: 14, fontWeight: "800", color: theme.text },
    workoutSub: { fontSize: 12, color: theme.muted, marginTop: 2, lineHeight: 17 },
    workoutStats: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    workoutStatItem: { flexDirection: "row", alignItems: "center", gap: 5 },
    workoutStat: { fontSize: 12, color: theme.muted },
    deleteBtn: { padding: 2 },
    muted: { color: theme.muted, fontSize: 14 },
  }), [theme]);

  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.muted}>Please log in to view your workout routine.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Workouts</Text>
            <Text style={styles.sub}>
              Your plan is matched to your profile goal, but you can still switch routines manually.
            </Text>
          </View>
          <TouchableOpacity style={styles.smallBtn} onPress={onRefresh}>
            <Text style={styles.smallBtnText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.alertWarn}>
            <Text style={styles.alertText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Profile driven plan</Text>
          <Text style={styles.heroTitle}>{activePlan.label}</Text>
          <Text style={styles.heroCopy}>{activePlan.focus}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { borderColor: activePlan.accent }]}>
              <Text style={[styles.badgeText, { color: activePlan.accent }]}>
                Goal: {formatLabel(user?.fitnessGoal || activePlan.key)}
              </Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                Activity: {formatLabel(user?.activityLevel || "MODERATELY_ACTIVE")}
              </Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activePlan.routines.length} choices</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Workout goals</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.goalRow}>
            {WORKOUT_GOAL_KEYS.map((goalKey) => {
              const plan = getWorkoutPlan(goalKey);
              const isActive = selectedGoalKey === goalKey;
              return (
                <TouchableOpacity
                  key={goalKey}
                  style={[
                    styles.goalCard,
                    isActive && styles.goalCardActive,
                    { borderColor: isActive ? plan.accent : "#1e2535" },
                  ]}
                  onPress={() => chooseGoal(goalKey)}
                >
                  <Text style={[styles.goalName, isActive && { color: plan.accent }]}>{plan.label}</Text>
                  <Text style={styles.goalSub}>{plan.subtitle}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended for you</Text>
          <View style={styles.recommendCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.recommendTitle}>{recommendedRoutine?.name}</Text>
              <Text style={styles.recommendSub}>
                Based on {formatLabel(user?.fitnessGoal || activePlan.label)} and{" "}
                {formatLabel(user?.activityLevel || "MODERATELY_ACTIVE")}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.recommendBtn}
              onPress={() => chooseRoutine(recommendedRoutine?.id)}
            >
              <Text style={styles.recommendBtnText}>Use</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose a routine</Text>
          {activePlan.routines.map((routine, index) => {
            const isActive = routine.id === activeRoutine?.id;
            return (
              <TouchableOpacity
                key={routine.id}
                style={[styles.routineCard, isActive && styles.routineCardActive]}
                onPress={() => chooseRoutine(routine.id)}
              >
                <View style={styles.routineTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.routineName}>{routine.name}</Text>
                    <Text style={styles.routineSub}>
                      {routine.durationMinutes} min · {routine.difficulty} · {routine.workoutType}
                    </Text>
                  </View>
                  <View style={styles.routineIndex}>
                    <Text style={styles.routineIndexText}>{index + 1}</Text>
                  </View>
                </View>
                <Text style={styles.routineDescription}>{routine.description}</Text>
                <View style={styles.routineMetaRow}>
                  <View style={styles.routineMetaItem}>
                    <MaterialCommunityIcons name="fire" size={14} color="#ff6b6b" />
                    <Text style={styles.routineMeta}>{routine.calories} kcal</Text>
                  </View>
                  <View style={styles.routineMetaItem}>
                    <MaterialCommunityIcons name="video-outline" size={14} color="#00e5a0" />
                    <Text style={styles.routineMeta}>Real video</Text>
                  </View>
                  <View style={styles.routineMetaItem}>
                    <MaterialCommunityIcons name="brain" size={14} color="#0099ff" />
                    <Text style={styles.routineMeta}>{routine.benefits?.[0] || "Personalized session"}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Live preview</Text>
          <WorkoutDemoPlayer
            routine={activeRoutine}
            workoutType={activeRoutine?.workoutType}
            elapsedSeconds={elapsedSeconds}
          />
          <View style={styles.instructionBox}>
            <Text style={styles.instructionTitle}>How to run this session</Text>
            {(activeRoutine?.instructions || []).slice(0, 3).map((item, index) => (
              <Text key={`${item}-${index}`} style={styles.instructionItem}>
                {index + 1}. {item}
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.timerCard}>
          <Text style={styles.timerTitle}>Workout timer</Text>
          <Text style={styles.timerValue}>{formatTime(elapsedSeconds)}</Text>
          <Text style={styles.timerSub}>
            {running ? "Session running" : "Paused"} · {sessionSteps.toLocaleString()} steps this session
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.primaryBtn} onPress={running ? pauseSession : startSession}>
              <Text style={styles.primaryBtnText}>
                {running ? "Pause" : elapsedSeconds > 0 ? "Resume" : "Start"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={resetSession}>
              <Text style={styles.secondaryBtnText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={saveSession}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#0a0e1a" />
            ) : (
              <Text style={styles.saveBtnText}>Finish & Save</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.helperText}>
            Your workout is saved with the selected routine, profile goal, exact time, and estimated calories.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{formatTime(elapsedSeconds)}</Text>
              <Text style={styles.summaryLabel}>Recorded time</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryValue, { color: "#0099ff" }]}>
                {sessionSteps.toLocaleString()}
              </Text>
              <Text style={styles.summaryLabel}>Session steps</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryValue, { color: "#fbbf24" }]}>
                {estimatedCalories.toLocaleString()}
              </Text>
              <Text style={styles.summaryLabel}>Estimated kcal</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryValue, { color: activePlan.accent }]}>
                {routineChoiceNumber}
              </Text>
              <Text style={styles.summaryLabel}>Routine choice</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today&apos;s saved workouts</Text>
          {workouts.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No workouts saved yet</Text>
              <Text style={styles.emptyText}>Start a routine and tap Finish & Save when you are done.</Text>
            </View>
          ) : (
            workouts.map((item) => (
              <View key={item.id} style={styles.workoutCard}>
                <View style={styles.workoutHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.workoutType}>
                      {formatLabel(item.workoutName || item.notes || item.workoutType)}
                    </Text>
                    <Text style={styles.workoutSub}>
                      {savedWorkoutDuration(item)} · {item.intensity || "LOW"} ·{" "}
                      {formatLabel(item.fitnessGoalLabel || item.fitnessGoal || item.workoutType)}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => deleteWorkout(item.id)} style={styles.deleteBtn}>
                    <MaterialCommunityIcons name="close-circle-outline" size={18} color="#ff6b6b" />
                  </TouchableOpacity>
                </View>
                <View style={styles.workoutStats}>
                  <View style={styles.workoutStatItem}>
                    <MaterialCommunityIcons name="walk" size={14} color="#00e5a0" />
                    <Text style={styles.workoutStat}>{Number(item.stepCount || 0).toLocaleString()} steps</Text>
                  </View>
                  <View style={styles.workoutStatItem}>
                    <MaterialCommunityIcons name="fire" size={14} color="#ff6b6b" />
                    <Text style={styles.workoutStat}>{Number(item.caloriesBurned || 0)} kcal</Text>
                  </View>
                  {item.videoUrl ? (
                    <View style={styles.workoutStatItem}>
                      <MaterialCommunityIcons name="video-outline" size={14} color="#0099ff" />
                      <Text style={styles.workoutStat}>video saved</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
