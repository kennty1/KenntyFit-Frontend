import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator, RefreshControl,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import API from "../../api/axios";

const QUICK_ACTIONS = [
  { icon: "dumbbell", label: "Workouts", route: "/(tabs)/workouts", color: "#00e5a0" },
  { icon: "food", label: "Meals", route: "/(tabs)/meals", color: "#fbbf24" },
  { icon: "cup-water", label: "Water", route: "/(tabs)/water", color: "#0099ff" },
  { icon: "chart-line", label: "Progress", route: "/(tabs)/progress", color: "#ff6b6b" },
  { icon: "barcode-scan", label: "Food Scan", route: "/food-scanner", color: "#8b5cf6" },
  { icon: "lightbulb-on-outline", label: "Suggestions", route: "/meal-suggestions", color: "#22c55e" },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [waterStatus, setWaterStatus] = useState(null);
  const [workoutSummary, setWorkoutSummary] = useState(null);
  const [mealPlan, setMealPlan] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      const [water, workout, meal] = await Promise.allSettled([
        API.get(`/water-intake/user/${user.id}/status`),
        API.get(`/workouts/user/${user.id}/summary`),
        API.get(`/meals/user/${user.id}/plan`),
      ]);
      if (water.status === "fulfilled") setWaterStatus(water.value.data);
      if (workout.status === "fulfilled") setWorkoutSummary(workout.value.data);
      if (meal.status === "fulfilled") setMealPlan(meal.value.data);
    } catch (e) {
      setError("Some data could not be loaded.");
    } finally { setLoading(false); setRefreshing(false); }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const styles = useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.background },
    container: { padding: 20, paddingBottom: 40 },
    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
    greeting: { fontSize: 13, color: theme.muted },
    username: { fontSize: 22, fontWeight: "800", color: theme.text },
    logoutBtn: { backgroundColor: theme.surface, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
    logoutText: { fontSize: 12, color: theme.muted, fontWeight: "600" },
    alertWarn: { backgroundColor: theme.warning + "22", borderRadius: 8, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: theme.warning + "33" },
    alertText: { color: theme.warning, fontSize: 13 },
    statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 28 },
    statCard: { backgroundColor: theme.surface, borderRadius: 12, padding: 14, width: "47%", borderTopWidth: 3, borderWidth: 1, borderColor: theme.border },
    statIcon: { marginBottom: 6 },
    statLabel: { fontSize: 10, color: theme.muted, textTransform: "uppercase", marginBottom: 4 },
    statValue: { fontSize: 26, fontWeight: "800" },
    statUnit: { fontSize: 11, color: theme.muted, marginTop: 2 },
    progressBar: { height: 3, backgroundColor: theme.border, borderRadius: 2, marginTop: 10, overflow: "hidden" },
    progressFill: { height: "100%", borderRadius: 2 },
    sectionTitle: { fontSize: 14, fontWeight: "700", color: theme.text, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
    quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 },
    quickCard: { backgroundColor: theme.surface, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 8, width: "31%", alignItems: "center", borderWidth: 1, borderColor: theme.border },
    quickIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 6, borderWidth: 1, backgroundColor: theme.accent + "22", borderColor: theme.accent + "44" },
    quickIcon: { width: 22, height: 22, resizeMode: "contain" },
    quickLabel: { fontSize: 10, color: theme.muted, fontWeight: "600", textAlign: "center" },
    mealRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: theme.surface, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: theme.border },
    mealIcon: { fontSize: 24 },
    mealName: { fontSize: 13, fontWeight: "600", color: theme.text },
    mealSub: { fontSize: 11, color: theme.muted, marginTop: 2 },
    muted: { color: theme.muted, fontSize: 14 },
    btnPrimary: { backgroundColor: theme.accent, borderRadius: 10, padding: 14, alignItems: "center", marginTop: 8, minWidth: 160 },
    btnPrimaryText: { fontSize: 15, fontWeight: "700", color: theme.accentText },
  }), [theme]);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.muted}>Please log in to view your dashboard.</Text>
          <TouchableOpacity style={styles.btnPrimary} onPress={() => router.push("/login")}>
            <Text style={styles.btnPrimaryText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator size="large" color={theme.accent} /></View>
      </SafeAreaView>
    );
  }

  const waterPct = waterStatus ? Math.min(100, Math.round((waterStatus.totalWaterMl / (waterStatus.targetWaterMl || 2500)) * 100)) : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.username}>{user.firstName || user.username} 👋</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {error ? <View style={styles.alertWarn}><Text style={styles.alertText}>⚠️ {error}</Text></View> : null}

        {/* Stat Cards */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderTopColor: "#00e5a0" }]}>
            <MaterialCommunityIcons name="cup-water" size={24} color="#00e5a0" style={styles.statIcon} />
            <Text style={styles.statLabel}>Water Today</Text>
            <Text style={[styles.statValue, { color: "#00e5a0" }]}>{waterStatus?.totalWaterMl || 0}</Text>
            <Text style={styles.statUnit}>ml</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${waterPct}%`, backgroundColor: "#00e5a0" }]} />
            </View>
          </View>
          <View style={[styles.statCard, { borderTopColor: "#0099ff" }]}>
            <MaterialCommunityIcons name="shoe-print" size={24} color="#0099ff" style={styles.statIcon} />
            <Text style={styles.statLabel}>Steps Today</Text>
            <Text style={[styles.statValue, { color: "#0099ff" }]}>{(workoutSummary?.totalSteps || 0).toLocaleString()}</Text>
            <Text style={styles.statUnit}>steps</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: "#ff6b6b" }]}>
            <MaterialCommunityIcons name="fire" size={24} color="#ff6b6b" style={styles.statIcon} />
            <Text style={styles.statLabel}>Calories Burned</Text>
            <Text style={[styles.statValue, { color: "#ff6b6b" }]}>{workoutSummary?.totalCaloriesBurned || 0}</Text>
            <Text style={styles.statUnit}>kcal</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: "#fbbf24" }]}>
            <MaterialCommunityIcons name="food-drumstick" size={24} color="#fbbf24" style={styles.statIcon} />
            <Text style={styles.statLabel}>Meal Calories</Text>
            <Text style={[styles.statValue, { color: "#fbbf24" }]}>{mealPlan?.totalCalories || 0}</Text>
            <Text style={styles.statUnit}>kcal planned</Text>
          </View>
        </View>

        {/* Quick Navigation */}
        <Text style={styles.sectionTitle}>Quick Access</Text>
        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map((item) => (
            <TouchableOpacity key={item.label} style={styles.quickCard} onPress={() => router.push(item.route)}>
              <View style={[styles.quickIconWrap, { backgroundColor: `${item.color}22`, borderColor: `${item.color}44` }]}>
                <MaterialCommunityIcons name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={styles.quickLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Today's meals preview */}
        {mealPlan?.meals?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Today's Meals</Text>
            {mealPlan.meals.slice(0, 3).map((meal) => (
              <View key={meal.id} style={styles.mealRow}>
                <Text style={styles.mealIcon}>
                  {meal.mealType === "BREAKFAST" ? "🍳" : meal.mealType === "LUNCH" ? "🍛" : "🍲"}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mealName}>{meal.mealName}</Text>
                  <Text style={styles.mealSub}>{meal.mealType} · {meal.calories} kcal</Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
