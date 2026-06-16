import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, RefreshControl, Modal,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";

const MEAL_ICONS = { BREAKFAST: "🍳", LUNCH: "🍛", DINNER: "🍲", SNACK: "🍎" };
const MEAL_ORDER = ["BREAKFAST", "LUNCH", "DINNER"];

const toDateKey = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

const formatTime = (value) => {
  if (!value) return "Flexible";
  const [hour = "00", minute = "00"] = value.split(":");
  const h = Number(hour);
  return `${h % 12 || 12}:${minute} ${h >= 12 ? "PM" : "AM"}`;
};

export default function Meals() {
  const { user } = useAuth();
  const [mealPlan, setMealPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      const res = await API.get(`/meals/user/${user.id}/plan`, { params: { date: toDateKey(new Date()) } });
      setMealPlan(res.data || null);
    } catch (e) { setError("Could not load meal plan."); }
    finally { setLoading(false); setRefreshing(false); }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const meals = useMemo(() => mealPlan?.meals || [], [mealPlan]);
  const primaryMeals = useMemo(() => MEAL_ORDER.map((t) => meals.find((m) => m.mealType === t)).filter(Boolean), [meals]);
  const snacks = useMemo(() => meals.filter((m) => !MEAL_ORDER.includes(m.mealType)), [meals]);

  if (loading) return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}><ActivityIndicator size="large" color="#00e5a0" /></View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#00e5a0" />}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Meals 🥗</Text>
        <Text style={styles.sub}>Today's meal plan · {new Date().toLocaleDateString()}</Text>

        {error ? <View style={styles.alertWarn}><Text style={styles.alertText}>{error}</Text></View> : null}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: "#ff6b6b" }]}>{(mealPlan?.totalCalories || 0).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Calories</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: "#00e5a0" }]}>{meals.length}</Text>
            <Text style={styles.statLabel}>Meal Entries</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: "#0099ff" }]}>
              {meals.reduce((s, m) => s + Number(m.protein || 0), 0).toFixed(1)}g
            </Text>
            <Text style={styles.statLabel}>Total Protein</Text>
          </View>
        </View>

        {/* Primary Meals */}
        {primaryMeals.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🥗</Text>
            <Text style={styles.emptyTitle}>No meal plan today</Text>
            <Text style={styles.emptyText}>Your backend-generated meal plan will appear here.</Text>
          </View>
        ) : (
          primaryMeals.map((meal) => (
            <TouchableOpacity key={meal.id} style={styles.mealCard} onPress={() => setSelectedMeal(meal)}>
              <View style={styles.mealHeader}>
                <Text style={styles.mealIcon}>{MEAL_ICONS[meal.mealType] || "🍽️"}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mealName}>{meal.mealName}</Text>
                  <Text style={styles.mealSub}>{meal.mealType} · {formatTime(meal.mealTime)}</Text>
                </View>
                <Text style={styles.mealCal}>{meal.calories} kcal</Text>
              </View>
              <Text style={styles.mealDesc} numberOfLines={2}>{meal.description}</Text>
              <View style={styles.macroRow}>
                <Text style={styles.macroItem}>🥩 {Number(meal.protein || 0).toFixed(1)}g protein</Text>
                <Text style={styles.macroItem}>🌾 {Number(meal.carbs || 0).toFixed(1)}g carbs</Text>
                <Text style={styles.macroItem}>🧈 {Number(meal.fats || 0).toFixed(1)}g fats</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Snacks */}
        {snacks.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Additional Items</Text>
            {snacks.map((meal) => (
              <View key={meal.id} style={styles.snackRow}>
                <Text style={styles.mealIcon}>{MEAL_ICONS[meal.mealType] || "🍎"}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mealName}>{meal.mealName}</Text>
                  <Text style={styles.mealSub}>{meal.calories || 0} kcal · {formatTime(meal.mealTime)}</Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Meal Detail Modal */}
      <Modal visible={!!selectedMeal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            {selectedMeal && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalIcon}>{MEAL_ICONS[selectedMeal.mealType] || "🍽️"}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle}>{selectedMeal.mealName}</Text>
                    <Text style={styles.mealSub}>{selectedMeal.mealType} · {formatTime(selectedMeal.mealTime)}</Text>
                  </View>
                </View>
                <Text style={styles.mealDesc}>{selectedMeal.description}</Text>
                <View style={styles.macroGrid}>
                  {[
                    { l: "Calories", v: selectedMeal.calories || 0, c: "#ff6b6b" },
                    { l: "Protein", v: `${Number(selectedMeal.protein || 0).toFixed(1)}g`, c: "#0099ff" },
                    { l: "Carbs", v: `${Number(selectedMeal.carbs || 0).toFixed(1)}g`, c: "#fbbf24" },
                  ].map((m) => (
                    <View key={m.l} style={styles.macroCard}>
                      <Text style={[styles.macroValue, { color: m.c }]}>{m.v}</Text>
                      <Text style={styles.macroLabel}>{m.l}</Text>
                    </View>
                  ))}
                </View>
                {selectedMeal.servingSize && (
                  <Text style={styles.detailText}>Serving: {selectedMeal.servingSize}</Text>
                )}
                <TouchableOpacity style={styles.btnPrimary} onPress={() => setSelectedMeal(null)}>
                  <Text style={styles.btnPrimaryText}>Close</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: "#111827", borderRadius: 10, padding: 12, alignItems: "center", borderWidth: 1, borderColor: "#1e2535" },
  statValue: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 9, color: "#6b7a99", textTransform: "uppercase", marginTop: 2, textAlign: "center" },
  emptyCard: { backgroundColor: "#111827", borderRadius: 16, padding: 32, alignItems: "center", borderWidth: 1, borderColor: "#1e2535" },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#fff", marginBottom: 6 },
  emptyText: { fontSize: 13, color: "#6b7a99", textAlign: "center" },
  mealCard: { backgroundColor: "#111827", borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#1e2535", borderLeftWidth: 4, borderLeftColor: "#00e5a0" },
  mealHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  mealIcon: { fontSize: 28 },
  mealName: { fontSize: 14, fontWeight: "700", color: "#fff" },
  mealSub: { fontSize: 11, color: "#6b7a99", marginTop: 2 },
  mealCal: { fontSize: 13, fontWeight: "700", color: "#ff6b6b" },
  mealDesc: { fontSize: 12, color: "#6b7a99", lineHeight: 18, marginBottom: 10 },
  macroRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  macroItem: { fontSize: 11, color: "#6b7a99" },
  sectionTitle: { fontSize: 12, fontWeight: "700", color: "#6b7a99", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, marginTop: 8 },
  snackRow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#111827", borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: "#1e2535" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modal: { backgroundColor: "#111827", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: "80%" },
  modalHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  modalIcon: { fontSize: 36 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  macroGrid: { flexDirection: "row", gap: 10, marginVertical: 16 },
  macroCard: { flex: 1, backgroundColor: "#0d1526", borderRadius: 10, padding: 12, alignItems: "center" },
  macroValue: { fontSize: 20, fontWeight: "800" },
  macroLabel: { fontSize: 10, color: "#6b7a99", textTransform: "uppercase", marginTop: 2 },
  detailText: { fontSize: 13, color: "#6b7a99", marginBottom: 16 },
  btnPrimary: { backgroundColor: "#00e5a0", borderRadius: 10, padding: 14, alignItems: "center", marginTop: 8, marginBottom: 20 },
  btnPrimaryText: { fontSize: 15, fontWeight: "700", color: "#0a0e1a" },
});
