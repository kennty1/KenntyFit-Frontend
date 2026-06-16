import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, RefreshControl, Alert, Modal, TextInput,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";

const WORKOUT_TYPES = ["RUNNING", "WALKING", "CYCLING", "SWIMMING", "WEIGHT_TRAINING", "YOGA", "OTHER"];
const INTENSITY = ["LOW", "MODERATE", "HIGH"];

export default function Workouts() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    workoutType: "RUNNING", durationMinutes: "", stepCount: "",
    caloriesBurned: "", notes: "", intensity: "MODERATE",
  });

  const getApiErrorMessage = (apiError, fallback = "Could not save workout.") => {
    const serverMessage =
      apiError?.response?.data?.message ||
      apiError?.response?.data?.error ||
      apiError?.response?.data?.title ||
      apiError?.message;
    return serverMessage ? String(serverMessage) : fallback;
  };

  const toDateKey = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  };

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    const today = toDateKey(new Date());
    try {
      const res = await API.get(`/workouts/user/${user.id}/date/${today}`);
      setWorkouts(Array.isArray(res.data) ? res.data : []);
    } catch { setError("Could not load workouts."); }
    finally { setLoading(false); setRefreshing(false); }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.durationMinutes) { Alert.alert("Required", "Please enter duration."); return; }
    setSaving(true);
    try {
      await API.post("/workouts", {
        userId: user.id,
        workoutType: form.workoutType,
        durationMinutes: +form.durationMinutes,
        stepCount: +form.stepCount || 0,
        caloriesBurned: +form.caloriesBurned || 0,
        notes: form.notes,
        intensity: form.intensity,
        workoutDate: toDateKey(new Date()),
      });
      setModalVisible(false);
      setForm({ workoutType: "RUNNING", durationMinutes: "", stepCount: "", caloriesBurned: "", notes: "", intensity: "MODERATE" });
      await load();
    } catch (apiError) {
      Alert.alert("Error", getApiErrorMessage(apiError));
    }
    finally { setSaving(false); }
  };

  const deleteWorkout = (id) => {
    Alert.alert("Delete", "Remove this workout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try { await API.delete(`/workouts/${id}`); await load(); }
        catch { Alert.alert("Error", "Could not delete."); }
      }},
    ]);
  };

  const getIcon = (type) => ({
    RUNNING: "🏃", WALKING: "🚶", CYCLING: "🚴", SWIMMING: "🏊",
    WEIGHT_TRAINING: "🏋️", YOGA: "🧘", OTHER: "💪",
  }[type] || "💪");

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
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Workouts 💪</Text>
            <Text style={styles.sub}>Today's activity log</Text>
          </View>
          <TouchableOpacity style={styles.btnPrimary} onPress={() => setModalVisible(true)}>
            <Text style={styles.btnPrimaryText}>+ Log</Text>
          </TouchableOpacity>
        </View>

        {error ? <View style={styles.alertWarn}><Text style={styles.alertText}>{error}</Text></View> : null}

        {/* Summary */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{workouts.length}</Text>
            <Text style={styles.summaryLabel}>Workouts</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: "#0099ff" }]}>
              {workouts.reduce((s, w) => s + (w.durationMinutes || 0), 0)}
            </Text>
            <Text style={styles.summaryLabel}>Minutes</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: "#ff6b6b" }]}>
              {workouts.reduce((s, w) => s + (w.caloriesBurned || 0), 0)}
            </Text>
            <Text style={styles.summaryLabel}>Calories</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: "#fbbf24" }]}>
              {workouts.reduce((s, w) => s + (w.stepCount || 0), 0).toLocaleString()}
            </Text>
            <Text style={styles.summaryLabel}>Steps</Text>
          </View>
        </View>

        {/* Workout List */}
        {workouts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🏋️</Text>
            <Text style={styles.emptyTitle}>No workouts yet</Text>
            <Text style={styles.emptyText}>Log your first workout to start tracking.</Text>
          </View>
        ) : (
          workouts.map((w) => (
            <View key={w.id} style={styles.workoutCard}>
              <View style={styles.workoutHeader}>
                <Text style={styles.workoutIcon}>{getIcon(w.workoutType)}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.workoutType}>{w.workoutType?.replace(/_/g, " ")}</Text>
                  <Text style={styles.workoutSub}>{w.durationMinutes} min · {w.intensity}</Text>
                </View>
                <TouchableOpacity onPress={() => deleteWorkout(w.id)}>
                  <Text style={styles.deleteText}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.workoutStats}>
                {w.caloriesBurned > 0 && <Text style={styles.workoutStat}>🔥 {w.caloriesBurned} kcal</Text>}
                {w.stepCount > 0 && <Text style={styles.workoutStat}>👟 {w.stepCount.toLocaleString()} steps</Text>}
                {w.notes && <Text style={styles.workoutStat}>📝 {w.notes}</Text>}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Workout Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Log Workout</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Workout Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                {WORKOUT_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeBtn, form.workoutType === t && styles.typeBtnActive]}
                    onPress={() => set("workoutType")(t)}
                  >
                    <Text style={{ color: form.workoutType === t ? "#0a0e1a" : "#6b7a99", fontSize: 12, fontWeight: "600" }}>
                      {getIcon(t)} {t.replace(/_/g, " ")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Duration (minutes) *</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={form.durationMinutes} onChangeText={set("durationMinutes")} placeholder="30" placeholderTextColor="#4a5568" />

              <Text style={styles.label}>Steps (optional)</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={form.stepCount} onChangeText={set("stepCount")} placeholder="0" placeholderTextColor="#4a5568" />

              <Text style={styles.label}>Calories Burned (optional)</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={form.caloriesBurned} onChangeText={set("caloriesBurned")} placeholder="0" placeholderTextColor="#4a5568" />

              <Text style={styles.label}>Intensity</Text>
              <View style={styles.intensityRow}>
                {INTENSITY.map((i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.intensityBtn, form.intensity === i && styles.intensityBtnActive]}
                    onPress={() => set("intensity")(i)}
                  >
                    <Text style={{ color: form.intensity === i ? "#0a0e1a" : "#6b7a99", fontWeight: "600", fontSize: 12 }}>{i}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Notes (optional)</Text>
              <TextInput style={[styles.input, { height: 80, textAlignVertical: "top" }]} multiline value={form.notes} onChangeText={set("notes")} placeholder="How did it go?" placeholderTextColor="#4a5568" />

              <View style={styles.modalBtns}>
                <TouchableOpacity style={styles.btnPrimary} onPress={handleSave} disabled={saving}>
                  {saving ? <ActivityIndicator color="#0a0e1a" /> : <Text style={styles.btnPrimaryText}>Save Workout</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnGhost} onPress={() => setModalVisible(false)}>
                  <Text style={styles.btnGhostText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "800", color: "#fff" },
  sub: { fontSize: 13, color: "#6b7a99" },
  btnPrimary: { backgroundColor: "#00e5a0", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, alignItems: "center" },
  btnPrimaryText: { fontSize: 14, fontWeight: "700", color: "#0a0e1a" },
  btnGhost: { borderRadius: 10, padding: 12, alignItems: "center", borderWidth: 1, borderColor: "#1e2535", marginTop: 10 },
  btnGhostText: { fontSize: 14, color: "#6b7a99", fontWeight: "600" },
  alertWarn: { backgroundColor: "rgba(251,191,36,0.1)", borderRadius: 8, padding: 12, marginBottom: 16 },
  alertText: { color: "#fbbf24", fontSize: 13 },
  summaryRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  summaryCard: { flex: 1, backgroundColor: "#111827", borderRadius: 10, padding: 10, alignItems: "center", borderWidth: 1, borderColor: "#1e2535" },
  summaryValue: { fontSize: 20, fontWeight: "800", color: "#00e5a0" },
  summaryLabel: { fontSize: 9, color: "#6b7a99", textTransform: "uppercase", marginTop: 2 },
  emptyCard: { backgroundColor: "#111827", borderRadius: 16, padding: 32, alignItems: "center", borderWidth: 1, borderColor: "#1e2535" },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#fff", marginBottom: 6 },
  emptyText: { fontSize: 13, color: "#6b7a99", textAlign: "center" },
  workoutCard: { backgroundColor: "#111827", borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#1e2535" },
  workoutHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  workoutIcon: { fontSize: 28 },
  workoutType: { fontSize: 14, fontWeight: "700", color: "#fff" },
  workoutSub: { fontSize: 12, color: "#6b7a99", marginTop: 2 },
  workoutStats: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  workoutStat: { fontSize: 12, color: "#6b7a99" },
  deleteText: { color: "#ff6b6b", fontSize: 16, fontWeight: "700" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modal: { backgroundColor: "#111827", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: "90%" },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#fff", marginBottom: 20 },
  modalBtns: { gap: 10, marginTop: 8, marginBottom: 20 },
  label: { fontSize: 11, color: "#6b7a99", fontWeight: "600", textTransform: "uppercase", marginBottom: 6 },
  input: { backgroundColor: "#0d1526", borderWidth: 1, borderColor: "#1e2535", borderRadius: 8, padding: 12, color: "#fff", fontSize: 14, marginBottom: 14 },
  typeBtn: { backgroundColor: "#0d1526", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: "#1e2535" },
  typeBtnActive: { backgroundColor: "#00e5a0", borderColor: "#00e5a0" },
  intensityRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  intensityBtn: { flex: 1, backgroundColor: "#0d1526", borderRadius: 8, padding: 10, alignItems: "center", borderWidth: 1, borderColor: "#1e2535" },
  intensityBtnActive: { backgroundColor: "#00e5a0", borderColor: "#00e5a0" },
});
