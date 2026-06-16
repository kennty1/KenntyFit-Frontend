import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, RefreshControl, Dimensions,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";

const { width } = Dimensions.get("window");

const toDateKey = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

const getGoalStatus = (current, target) => {
  const pct = target > 0 ? (current / target) * 100 : 0;
  if (pct >= 100) return { text: "Exceeded", color: "#00e5a0" };
  if (pct >= 75) return { text: "Great", color: "#00e5a0" };
  if (pct >= 50) return { text: "Good", color: "#0099ff" };
  return { text: "Working", color: "#ff6b6b" };
};

function BarGraph({ data }) {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map((d) => d.steps || 0), 1);
  const barW = (width - 80) / data.length - 4;
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", height: 120, gap: 4 }}>
      {data.map((item, i) => {
        const h = Math.max(4, ((item.steps || 0) / maxVal) * 100);
        return (
          <View key={i} style={{ alignItems: "center", flex: 1 }}>
            <View style={{ width: "100%", height: h, backgroundColor: "#00e5a0", borderRadius: 4 }} />
            <Text style={{ fontSize: 9, color: "#6b7a99", marginTop: 4 }}>{item.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function Progress() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("week");
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [todayWorkout, setTodayWorkout] = useState(null);
  const [todayWater, setTodayWater] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    const path = timeRange === "week" ? "weekly-summary" : "monthly-summary";
    try {
      const [sumRes, workRes, waterRes] = await Promise.allSettled([
        API.get(`/progress/user/${user.id}/${path}`),
        API.get(`/workouts/user/${user.id}/summary`),
        API.get(`/water-intake/user/${user.id}/status`),
      ]);
      const s = sumRes.status === "fulfilled" ? sumRes.value.data : null;
      setSummary(s);
      if (workRes.status === "fulfilled") setTodayWorkout(workRes.value.data);
      if (waterRes.status === "fulfilled") setTodayWater(waterRes.value.data);

      if (s?.startDate && s?.endDate) {
        const wRes = await API.get(`/workouts/user/${user.id}/date-range`, {
          params: { startDate: s.startDate, endDate: s.endDate },
        }).catch(() => null);
        if (wRes) {
          const workouts = Array.isArray(wRes.data) ? wRes.data : [];
          const grouped = new Map();
          const start = new Date(s.startDate);
          const end = new Date(s.endDate);
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const key = toDateKey(d);
            grouped.set(key, {
              label: timeRange === "week"
                ? d.toLocaleDateString("en-NG", { weekday: "short" })
                : String(d.getDate()).padStart(2, "0"),
              steps: 0,
            });
          }
          workouts.forEach((w) => {
            if (grouped.has(w.workoutDate)) grouped.get(w.workoutDate).steps += Number(w.stepCount || 0);
          });
          setChartData(Array.from(grouped.values()));
        }
      }
    } catch { setError("Could not load progress data."); }
    finally { setLoading(false); setRefreshing(false); }
  }, [user?.id, timeRange]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}><ActivityIndicator size="large" color="#00e5a0" /></View>
    </SafeAreaView>
  );

  const stepGoal = timeRange === "week" ? 70000 : 300000;
  const waterGoal = (user?.dailyWaterTarget || 2500) * (timeRange === "week" ? 7 : 30);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#00e5a0" />}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Progress 📈</Text>
        <Text style={styles.sub}>Backend activity analytics</Text>

        {error ? <View style={styles.alertWarn}><Text style={styles.alertText}>{error}</Text></View> : null}

        {/* Time range toggle */}
        <View style={styles.toggleRow}>
          {["week", "month"].map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.toggleBtn, timeRange === r && styles.toggleBtnActive]}
              onPress={() => setTimeRange(r)}
            >
              <Text style={[styles.toggleText, timeRange === r && styles.toggleTextActive]}>
                {r === "week" ? "Weekly" : "Monthly"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Today at a glance */}
        {(todayWorkout || todayWater) && (
          <View style={styles.glanceCard}>
            <Text style={styles.glanceTitle}>Today at a Glance</Text>
            <View style={styles.glanceRow}>
              <View style={styles.glanceStat}>
                <Text style={styles.glanceValue}>{(todayWorkout?.totalSteps || 0).toLocaleString()}</Text>
                <Text style={styles.glanceLabel}>Steps</Text>
              </View>
              <View style={styles.glanceStat}>
                <Text style={styles.glanceValue}>{(todayWorkout?.totalCaloriesBurned || 0).toLocaleString()}</Text>
                <Text style={styles.glanceLabel}>Calories</Text>
              </View>
              <View style={styles.glanceStat}>
                <Text style={styles.glanceValue}>{(todayWater?.totalWaterMl || 0).toLocaleString()}</Text>
                <Text style={styles.glanceLabel}>Water ml</Text>
              </View>
            </View>
          </View>
        )}

        {/* Summary stats */}
        {summary && (
          <View style={styles.statsGrid}>
            {[
              { label: "Total Steps", value: (summary.totalSteps || 0).toLocaleString(), color: "#00e5a0" },
              { label: "Avg Daily Steps", value: (summary.averageDailySteps || 0).toLocaleString(), color: "#0099ff" },
              { label: "Water Total (ml)", value: (summary.waterTotalMl || 0).toLocaleString(), color: "#fbbf24" },
              { label: "Workouts Done", value: summary.workoutsCompleted || 0, color: "#ff6b6b" },
            ].map((s) => (
              <View key={s.label} style={styles.statCard}>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Bar chart */}
        {chartData.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.sectionTitle}>{timeRange === "week" ? "Weekly" : "Monthly"} Step Breakdown</Text>
            <BarGraph data={chartData} />
          </View>
        )}

        {/* Goals */}
        {summary && (
          <View style={styles.goalsCard}>
            <Text style={styles.sectionTitle}>Goals Status</Text>
            {[
              { name: "Step Goal", target: stepGoal, current: summary.totalSteps || 0 },
              { name: "Water Goal (ml)", target: waterGoal, current: summary.waterTotalMl || 0 },
              { name: "Workout Minutes", target: timeRange === "week" ? 150 : 600, current: summary.totalWorkoutMinutes || 0 },
            ].map((goal) => {
              const pct = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
              const status = getGoalStatus(goal.current, goal.target);
              return (
                <View key={goal.name} style={styles.goalRow}>
                  <View style={styles.goalInfo}>
                    <Text style={styles.goalName}>{goal.name}</Text>
                    <Text style={styles.goalNumbers}>{goal.current.toLocaleString()} / {goal.target.toLocaleString()}</Text>
                  </View>
                  <View style={styles.goalBarBg}>
                    <View style={[styles.goalBarFill, { width: `${pct}%`, backgroundColor: status.color }]} />
                  </View>
                  <Text style={[styles.goalPct, { color: status.color }]}>{pct}%</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Insights */}
        {summary?.summary && (
          <View style={styles.insightCard}>
            <Text style={styles.sectionTitle}>Insights</Text>
            <Text style={styles.insightText}>• {summary.summary}</Text>
            <Text style={styles.insightText}>• Avg daily water: {(summary.averageDailyWaterMl || 0).toLocaleString()} ml</Text>
            <Text style={styles.insightText}>• Calories burned: {(summary.totalCaloriesBurned || 0).toLocaleString()} kcal</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0e1a" },
  container: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "800", color: "#fff", marginBottom: 4 },
  sub: { fontSize: 13, color: "#6b7a99", marginBottom: 20 },
  alertWarn: { backgroundColor: "rgba(251,191,36,0.1)", borderRadius: 8, padding: 12, marginBottom: 16 },
  alertText: { color: "#fbbf24", fontSize: 13 },
  toggleRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  toggleBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "#1e2535" },
  toggleBtnActive: { backgroundColor: "#00e5a0", borderColor: "#00e5a0" },
  toggleText: { fontSize: 13, fontWeight: "600", color: "#6b7a99" },
  toggleTextActive: { color: "#0a0e1a" },
  glanceCard: { background: "linear-gradient(135deg, #00e5a0, #0099ff)", backgroundColor: "#00b887", borderRadius: 14, padding: 18, marginBottom: 20 },
  glanceTitle: { fontSize: 14, fontWeight: "700", color: "#fff", marginBottom: 14 },
  glanceRow: { flexDirection: "row", justifyContent: "space-around" },
  glanceStat: { alignItems: "center" },
  glanceValue: { fontSize: 22, fontWeight: "800", color: "#fff" },
  glanceLabel: { fontSize: 10, color: "rgba(255,255,255,0.8)", marginTop: 2, textTransform: "uppercase" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  statCard: { backgroundColor: "#111827", borderRadius: 12, padding: 14, width: "47%", borderWidth: 1, borderColor: "#1e2535" },
  statValue: { fontSize: 24, fontWeight: "800", marginBottom: 4 },
  statLabel: { fontSize: 10, color: "#6b7a99", textTransform: "uppercase" },
  chartCard: { backgroundColor: "#111827", borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: "#1e2535" },
  sectionTitle: { fontSize: 12, fontWeight: "700", color: "#fff", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 },
  goalsCard: { backgroundColor: "#111827", borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: "#1e2535" },
  goalRow: { marginBottom: 16 },
  goalInfo: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  goalName: { fontSize: 13, fontWeight: "600", color: "#fff" },
  goalNumbers: { fontSize: 11, color: "#6b7a99" },
  goalBarBg: { height: 6, backgroundColor: "#1e2535", borderRadius: 3, overflow: "hidden", marginBottom: 4 },
  goalBarFill: { height: "100%", borderRadius: 3 },
  goalPct: { fontSize: 11, fontWeight: "700", textAlign: "right" },
  insightCard: { backgroundColor: "#111827", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#1e2535" },
  insightText: { fontSize: 13, color: "#6b7a99", lineHeight: 22 },
});
