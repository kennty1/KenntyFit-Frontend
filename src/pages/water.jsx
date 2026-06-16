import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator, RefreshControl, Alert,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";

const DEFAULT_GOAL = 2500;

const toDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getMotivation = (pct) => {
  if (pct < 25) return { emoji: "💧", text: "Just getting started. Keep drinking." };
  if (pct < 50) return { emoji: "💦", text: "Good progress. Stay consistent." };
  if (pct < 75) return { emoji: "🌊", text: "You're more than halfway there." };
  if (pct < 100) return { emoji: "🏊", text: "Almost at your hydration goal!" };
  return { emoji: "🏆", text: "Goal reached! Keep the rhythm going." };
};

export default function Water() {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [todayEntries, setTodayEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    const today = toDateKey(new Date());
    try {
      const [s, e] = await Promise.allSettled([
        API.get(`/water-intake/user/${user.id}/status`),
        API.get(`/water-intake/user/${user.id}/date/${today}`),
      ]);
      if (s.status === "fulfilled") setStatus(s.value.data);
      if (e.status === "fulfilled") setTodayEntries(Array.isArray(e.value.data) ? e.value.data : []);
    } catch (err) {
      setError("Could not load hydration data.");
    } finally { setLoading(false); setRefreshing(false); }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const deleteEntry = async (id) => {
    Alert.alert("Delete", "Remove this water entry?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try { await API.delete(`/water-intake/${id}`); await load(); }
        catch { Alert.alert("Error", "Could not delete entry."); }
      }},
    ]);
  };

  if (loading) return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}><ActivityIndicator size="large" color="#00e5a0" /></View>
    </SafeAreaView>
  );

  const goal = status?.dailyTarget || DEFAULT_GOAL;
  const total = status?.totalWaterMl || 0;
  const pct = Math.min(100, Math.round((total / goal) * 100));
  const motivation = getMotivation(pct);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#00e5a0" />}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Hydration</Text>
        <Text style={styles.sub}>Auto-recorded water tracking</Text>

        {error ? <View style={styles.alertWarn}><Text style={styles.alertText}>{error}</Text></View> : null}

        {/* Main circle progress */}
        <View style={styles.progressCard}>
          <Text style={styles.motivationEmoji}>{motivation.emoji}</Text>
          <Text style={styles.totalMl}>{total.toLocaleString()}</Text>
          <Text style={styles.totalLabel}>of {goal.toLocaleString()} ml goal</Text>
          <View style={styles.progressBarWide}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.pctText}>{pct}% complete</Text>
          <Text style={styles.motivationText}>{motivation.text}</Text>
        </View>

        <View style={styles.autoCard}>
          <Text style={styles.autoIcon}>💧</Text>
          <View style={styles.autoTextWrap}>
            <Text style={styles.autoTitle}>Auto-recording enabled</Text>
            <Text style={styles.autoText}>
              Keep your phone on you while drinking. The app estimates hydration from motion and saves it automatically.
            </Text>
          </View>
        </View>

        {/* Today's entries */}
        <Text style={styles.sectionTitle}>Today's Entries ({todayEntries.length})</Text>
        {todayEntries.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No auto-recorded entries yet.</Text>
          </View>
        ) : (
          todayEntries.map((entry) => (
            <View key={entry.id} style={styles.entryRow}>
              <Text style={styles.entryIcon}>💧</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.entryAmt}>{entry.amountMl} ml</Text>
                <Text style={styles.entrySub}>{entry.notes || "Water"} · {entry.time || ""}</Text>
              </View>
              <TouchableOpacity onPress={() => deleteEntry(entry.id)} style={styles.deleteBtn}>
                <Text style={styles.deleteText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))
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
  alertWarn: { backgroundColor: "rgba(251,191,36,0.1)", borderRadius: 8, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "rgba(251,191,36,0.3)" },
  alertText: { color: "#fbbf24", fontSize: 13 },
  progressCard: { backgroundColor: "#111827", borderRadius: 16, padding: 24, alignItems: "center", marginBottom: 24, borderWidth: 1, borderColor: "#1e2535" },
  motivationEmoji: { fontSize: 40, marginBottom: 8 },
  totalMl: { fontSize: 52, fontWeight: "900", color: "#00e5a0" },
  totalLabel: { fontSize: 13, color: "#6b7a99", marginBottom: 16 },
  progressBarWide: { width: "100%", height: 8, backgroundColor: "#1e2535", borderRadius: 4, overflow: "hidden", marginBottom: 8 },
  progressFill: { height: "100%", backgroundColor: "#00e5a0", borderRadius: 4 },
  pctText: { fontSize: 14, fontWeight: "700", color: "#00e5a0", marginBottom: 6 },
  motivationText: { fontSize: 13, color: "#6b7a99", textAlign: "center" },
  sectionTitle: { fontSize: 12, fontWeight: "700", color: "#6b7a99", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
  autoCard: { flexDirection: "row", gap: 12, alignItems: "flex-start", backgroundColor: "#111827", borderRadius: 14, padding: 16, marginBottom: 22, borderWidth: 1, borderColor: "#1e2535" },
  autoIcon: { fontSize: 20, marginTop: 1 },
  autoTextWrap: { flex: 1 },
  autoTitle: { fontSize: 14, fontWeight: "800", color: "#fff", marginBottom: 4 },
  autoText: { fontSize: 12, lineHeight: 18, color: "#6b7a99" },
  emptyCard: { backgroundColor: "#111827", borderRadius: 12, padding: 24, alignItems: "center", borderWidth: 1, borderColor: "#1e2535" },
  emptyText: { color: "#6b7a99", fontSize: 14 },
  entryRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#111827", borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: "#1e2535" },
  entryIcon: { fontSize: 22 },
  entryAmt: { fontSize: 15, fontWeight: "700", color: "#00e5a0" },
  entrySub: { fontSize: 11, color: "#6b7a99", marginTop: 2 },
  deleteBtn: { padding: 8 },
  deleteText: { color: "#ff6b6b", fontSize: 14, fontWeight: "700" },
});
