import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator, RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";

export default function Dashboard() {
  const { user, logout } = useAuth();
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
        <View style={styles.center}><ActivityIndicator size="large" color="#00e5a0" /></View>
      </SafeAreaView>
    );
  }

  const waterPct = waterStatus ? Math.min(100, Math.round((waterStatus.totalWaterMl / (waterStatus.dailyTarget || 2500)) * 100)) : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00e5a0" />}
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
            <Text style={styles.statIcon}>💧</Text>
            <Text style={styles.statLabel}>Water Today</Text>
            <Text style={[styles.statValue, { color: "#00e5a0" }]}>{waterStatus?.totalWaterMl || 0}</Text>
            <Text style={styles.statUnit}>ml</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${waterPct}%`, backgroundColor: "#00e5a0" }]} />
            </View>
          </View>
          <View style={[styles.statCard, { borderTopColor: "#0099ff" }]}>
            <Text style={styles.statIcon}>👟</Text>
            <Text style={styles.statLabel}>Steps Today</Text>
            <Text style={[styles.statValue, { color: "#0099ff" }]}>{(workoutSummary?.totalSteps || 0).toLocaleString()}</Text>
            <Text style={styles.statUnit}>steps</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: "#ff6b6b" }]}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statLabel}>Calories Burned</Text>
            <Text style={[styles.statValue, { color: "#ff6b6b" }]}>{workoutSummary?.totalCaloriesBurned || 0}</Text>
            <Text style={styles.statUnit}>kcal</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: "#fbbf24" }]}>
            <Text style={styles.statIcon}>🥗</Text>
            <Text style={styles.statLabel}>Meal Calories</Text>
            <Text style={[styles.statValue, { color: "#fbbf24" }]}>{mealPlan?.totalCalories || 0}</Text>
            <Text style={styles.statUnit}>kcal planned</Text>
          </View>
        </View>

        {/* Quick Navigation */}
        <Text style={styles.sectionTitle}>Quick Access</Text>
        <View style={styles.quickGrid}>
          {[
            { icon: "💪", label: "Workouts", route: "/(tabs)/workouts" },
            { icon: "🥗", label: "Meals", route: "/(tabs)/meals" },
            { icon: "💧", label: "Water", route: "/(tabs)/water" },
            { icon: "📈", label: "Progress", route: "/(tabs)/progress" },
            { icon: "🔍", label: "Food Scan", route: "/food-scanner" },
            { icon: "🍲", label: "Suggestions", route: "/meal-suggestions" },
            { icon: "⚙️", label: "Settings", route: "/settings" },
            { icon: "💳", label: "Pricing", route: "/pricing" },
          ].map((item) => (
            <TouchableOpacity key={item.label} style={styles.quickCard} onPress={() => router.push(item.route)}>
              <Text style={styles.quickIcon}>{item.icon}</Text>
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0e1a" },
  container: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  greeting: { fontSize: 13, color: "#6b7a99" },
  username: { fontSize: 22, fontWeight: "800", color: "#fff" },
  logoutBtn: { backgroundColor: "#1e2535", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  logoutText: { fontSize: 12, color: "#6b7a99", fontWeight: "600" },
  alertWarn: { backgroundColor: "rgba(251,191,36,0.1)", borderRadius: 8, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "rgba(251,191,36,0.3)" },
  alertText: { color: "#fbbf24", fontSize: 13 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 28 },
  statCard: { backgroundColor: "#111827", borderRadius: 12, padding: 14, width: "47%", borderTopWidth: 3, borderWidth: 1, borderColor: "#1e2535" },
  statIcon: { fontSize: 22, marginBottom: 6 },
  statLabel: { fontSize: 10, color: "#6b7a99", textTransform: "uppercase", marginBottom: 4 },
  statValue: { fontSize: 26, fontWeight: "800" },
  statUnit: { fontSize: 11, color: "#6b7a99", marginTop: 2 },
  progressBar: { height: 3, backgroundColor: "#1e2535", borderRadius: 2, marginTop: 10, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#fff", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 28 },
  quickCard: { backgroundColor: "#111827", borderRadius: 12, padding: 14, width: "30%", alignItems: "center", borderWidth: 1, borderColor: "#1e2535" },
  quickIcon: { fontSize: 24, marginBottom: 6 },
  quickLabel: { fontSize: 11, color: "#6b7a99", fontWeight: "600" },
  mealRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#111827", borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: "#1e2535" },
  mealIcon: { fontSize: 24 },
  mealName: { fontSize: 13, fontWeight: "600", color: "#fff" },
  mealSub: { fontSize: 11, color: "#6b7a99", marginTop: 2 },
  muted: { color: "#6b7a99", fontSize: 14 },
  btnPrimary: { backgroundColor: "#00e5a0", borderRadius: 10, padding: 14, alignItems: "center", marginTop: 8, minWidth: 160 },
  btnPrimaryText: { fontSize: 15, fontWeight: "700", color: "#0a0e1a" },
});
