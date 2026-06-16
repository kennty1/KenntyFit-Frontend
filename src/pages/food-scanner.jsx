import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Image, Alert, RefreshControl,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";

const HEALTH = {
  HEALTHY:   { label: "Healthy",   color: "#00e5a0", bg: "rgba(0,229,160,0.15)" },
  MODERATE:  { label: "Moderate",  color: "#fbbf24", bg: "rgba(251,191,36,0.15)" },
  UNHEALTHY: { label: "Unhealthy", color: "#ff6b6b", bg: "rgba(255,107,107,0.15)" },
};

export default function FoodScanner() {
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("scan");
  const [loadHist, setLoadHist] = useState(false);

  const analyzeImage = async (uri) => {
    if (!user?.id) { setError("User session not ready. Try again."); return; }
    setScanning(true); setError("");
    try {
      // Convert image to base64
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const res = await API.post("/food/analyze", {
        userId: user.id,
        imageBase64: base64,
        imageType: "jpeg",
      });
      setResult(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message;
      setError(msg || "Could not analyze image. Please try again.");
    } finally { setScanning(false); }
  };

  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission needed", "Allow photo access to scan food."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPreview(result.assets[0].uri);
      setResult(null); setError("");
      await analyzeImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission needed", "Allow camera access to scan food."); return; }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true, quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPreview(result.assets[0].uri);
      setResult(null); setError("");
      await analyzeImage(result.assets[0].uri);
    }
  };

  const loadHistory = async () => {
    setActiveTab("history"); setLoadHist(true);
    try {
      const r = await API.get(`/food/history/${user.id}`);
      setHistory(r.data || []);
    } catch { setHistory([]); }
    finally { setLoadHist(false); }
  };

  const deleteHistoryItem = async (id) => {
    Alert.alert("Delete", "Remove this scan?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          await API.delete(`/food/${id}`);
          setHistory(h => h.filter(x => x.id !== id));
        } catch { Alert.alert("Error", "Could not delete scan."); }
      }},
    ]);
  };

  const h = result ? (HEALTH[result.healthRating] || HEALTH.MODERATE) : null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Food Scanner 🔍</Text>
        <Text style={styles.sub}>AI detects calories, macros & health rating instantly</Text>

        {/* Tab switcher */}
        <View style={styles.tabRow}>
          {[{ key: "scan", label: "Scan Food" }, { key: "history", label: "Scan History" }].map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabBtn, activeTab === t.key && styles.tabBtnActive]}
              onPress={() => t.key === "history" ? loadHistory() : setActiveTab("scan")}
            >
              <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === "scan" && (
          <>
            {/* Upload area */}
            <View style={styles.uploadCard}>
              {preview ? (
                <Image source={{ uri: preview }} style={styles.previewImage} resizeMode="cover" />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Text style={styles.uploadEmoji}>📷</Text>
                  <Text style={styles.uploadTitle}>Take or upload a food photo</Text>
                  <Text style={styles.uploadSub}>AI will detect food and calculate nutrition</Text>
                </View>
              )}
              <View style={styles.uploadBtns}>
                <TouchableOpacity style={styles.uploadBtn} onPress={takePhoto} disabled={scanning}>
                  <Text style={styles.uploadBtnText}>📸 Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.uploadBtn, styles.uploadBtnSecondary]} onPress={pickFromLibrary} disabled={scanning}>
                  <Text style={[styles.uploadBtnText, { color: "#00e5a0" }]}>📁 Gallery</Text>
                </TouchableOpacity>
              </View>
            </View>

            {error ? <View style={styles.alertError}><Text style={styles.alertText}>⚠️ {error}</Text></View> : null}

            {/* Scanning indicator */}
            {scanning && (
              <View style={styles.scanningCard}>
                <Text style={styles.scanningEmoji}>🤖</Text>
                <Text style={styles.scanningTitle}>Analyzing with Google Gemini AI...</Text>
                <Text style={styles.scanningSub}>Detecting food and calculating nutrients</Text>
                <ActivityIndicator size="large" color="#00e5a0" style={{ marginTop: 12 }} />
              </View>
            )}

            {/* How it works */}
            {!scanning && !result && (
              <View style={styles.howCard}>
                <Text style={styles.howTitle}>HOW IT WORKS</Text>
                {[["📸", "Upload or take a food photo"], ["🤖", "Gemini AI identifies the food"], ["📊", "Get calories, macros & health rating"], ["💡", "Use the result as meal guidance"]].map(([icon, text]) => (
                  <View key={text} style={styles.howRow}>
                    <Text style={styles.howIcon}>{icon}</Text>
                    <Text style={styles.howText}>{text}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Result card */}
            {result && !scanning && (
              <View style={styles.resultCard}>
                {/* Header */}
                <View style={styles.resultHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultFoodName}>{result.foodName}</Text>
                    <Text style={styles.resultServing}>{result.servingSize}{result.cookingMethod ? ` · ${result.cookingMethod}` : ""}</Text>
                    {result.healthScore && (
                      <View style={styles.scoreRow}>
                        <View style={styles.scoreBarBg}>
                          <View style={[styles.scoreBarFill, { width: `${result.healthScore}%`, backgroundColor: h?.color }]} />
                        </View>
                        <Text style={styles.scoreText}>Score: {result.healthScore}/100</Text>
                      </View>
                    )}
                  </View>
                  <View style={[styles.healthBadge, { backgroundColor: h?.bg }]}>
                    <Text style={[styles.healthBadgeText, { color: h?.color }]}>{h?.label}</Text>
                  </View>
                </View>

                {/* Macros */}
                <View style={styles.macroGrid}>
                  {[
                    { l: "Calories", v: result.calories, c: "#ff6b6b" },
                    { l: "Protein", v: `${result.protein?.toFixed(1)}g`, c: "#0099ff" },
                    { l: "Carbs", v: `${result.carbs?.toFixed(1)}g`, c: "#fbbf24" },
                    { l: "Fats", v: `${result.fats?.toFixed(1)}g`, c: "#a78bfa" },
                    { l: "Fiber", v: `${result.fiber?.toFixed(1)}g`, c: "#00e5a0" },
                  ].map((m) => (
                    <View key={m.l} style={styles.macroBox}>
                      <Text style={[styles.macroValue, { color: m.c }]}>{m.v}</Text>
                      <Text style={styles.macroLabel}>{m.l}</Text>
                    </View>
                  ))}
                </View>

                {/* Sugar & Sodium */}
                {(result.sugar || result.sodium) && (
                  <View style={styles.extraRow}>
                    {result.sugar && <View style={styles.extraBox}><Text style={styles.extraLabel}>Sugar</Text><Text style={styles.extraValue}>{result.sugar?.toFixed(1)}g</Text></View>}
                    {result.sodium && <View style={styles.extraBox}><Text style={styles.extraLabel}>Sodium</Text><Text style={styles.extraValue}>{result.sodium?.toFixed(0)}mg</Text></View>}
                  </View>
                )}

                {result.allergens && result.allergens !== "None" && (
                  <View style={styles.allergenBox}>
                    <Text style={styles.allergenText}>⚠️ Allergens: <Text style={{ color: "#6b7a99" }}>{result.allergens}</Text></Text>
                  </View>
                )}

                {result.healthExplanation && (
                  <View style={styles.infoBox}>
                    <Text style={styles.infoText}><Text style={{ color: "#fff", fontWeight: "700" }}>Assessment: </Text>{result.healthExplanation}</Text>
                  </View>
                )}

                {result.recommendation && (
                  <View style={styles.infoBox}>
                    <Text style={styles.infoText}><Text style={{ color: "#fff", fontWeight: "700" }}>💡 Tip: </Text>{result.recommendation}</Text>
                  </View>
                )}

                <TouchableOpacity style={styles.btnPrimary} onPress={() => { setResult(null); setPreview(null); }}>
                  <Text style={styles.btnPrimaryText}>Scan Again</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* History tab */}
        {activeTab === "history" && (
          <View style={styles.historyCard}>
            {loadHist ? (
              <ActivityIndicator size="large" color="#00e5a0" style={{ padding: 32 }} />
            ) : history.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>🔍</Text>
                <Text style={styles.emptyText}>No scans yet. Scan your first food!</Text>
              </View>
            ) : (
              history.map((s) => {
                const hh = HEALTH[s.healthRating] || HEALTH.MODERATE;
                return (
                  <View key={s.id} style={styles.historyRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyName}>{s.foodName}</Text>
                      <Text style={styles.historySub}>{s.servingSize} · {new Date(s.scannedAt).toLocaleDateString()}</Text>
                      <View style={styles.historyMacros}>
                        <Text style={styles.historyMacroText}>🔥 {s.calories} kcal</Text>
                        <Text style={styles.historyMacroText}>🥩 {s.protein?.toFixed(1)}g</Text>
                        <Text style={styles.historyMacroText}>🌾 {s.carbs?.toFixed(1)}g</Text>
                      </View>
                    </View>
                    <View style={styles.historyRight}>
                      <View style={[styles.healthBadge, { backgroundColor: hh.bg }]}>
                        <Text style={[styles.healthBadgeText, { color: hh.color }]}>{hh.label}</Text>
                      </View>
                      <TouchableOpacity onPress={() => deleteHistoryItem(s.id)} style={styles.deleteBtn}>
                        <Text style={styles.deleteText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0e1a" },
  container: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "800", color: "#fff", marginBottom: 4 },
  sub: { fontSize: 13, color: "#6b7a99", marginBottom: 20 },
  tabRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  tabBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "#1e2535" },
  tabBtnActive: { backgroundColor: "#00e5a0", borderColor: "#00e5a0" },
  tabText: { fontSize: 13, fontWeight: "600", color: "#6b7a99" },
  tabTextActive: { color: "#0a0e1a" },
  uploadCard: { backgroundColor: "#111827", borderRadius: 14, overflow: "hidden", marginBottom: 16, borderWidth: 1, borderColor: "#1e2535" },
  previewImage: { width: "100%", height: 200 },
  uploadPlaceholder: { padding: 32, alignItems: "center" },
  uploadEmoji: { fontSize: 40, marginBottom: 10 },
  uploadTitle: { fontSize: 15, fontWeight: "700", color: "#fff", marginBottom: 6 },
  uploadSub: { fontSize: 12, color: "#6b7a99", textAlign: "center" },
  uploadBtns: { flexDirection: "row", gap: 10, padding: 12 },
  uploadBtn: { flex: 1, backgroundColor: "#00e5a0", borderRadius: 8, padding: 12, alignItems: "center" },
  uploadBtnSecondary: { backgroundColor: "transparent", borderWidth: 1, borderColor: "#00e5a0" },
  uploadBtnText: { fontSize: 13, fontWeight: "700", color: "#0a0e1a" },
  alertError: { backgroundColor: "rgba(255,107,107,0.1)", borderRadius: 8, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: "rgba(255,107,107,0.3)" },
  alertText: { color: "#ff6b6b", fontSize: 13 },
  scanningCard: { backgroundColor: "#111827", borderRadius: 14, padding: 28, alignItems: "center", marginBottom: 16, borderWidth: 1, borderColor: "#1e2535" },
  scanningEmoji: { fontSize: 36, marginBottom: 10 },
  scanningTitle: { fontSize: 14, fontWeight: "700", color: "#fff", marginBottom: 6 },
  scanningSub: { fontSize: 12, color: "#6b7a99" },
  howCard: { backgroundColor: "#111827", borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#1e2535" },
  howTitle: { fontSize: 11, fontWeight: "700", color: "#6b7a99", letterSpacing: 1, marginBottom: 14 },
  howRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  howIcon: { fontSize: 18, width: 26 },
  howText: { fontSize: 13, color: "#6b7a99" },
  resultCard: { backgroundColor: "#111827", borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: "#1e2535" },
  resultHeader: { flexDirection: "row", alignItems: "flex-start", padding: 14, borderBottomWidth: 1, borderBottomColor: "#1e2535" },
  resultFoodName: { fontSize: 15, fontWeight: "700", color: "#fff", marginBottom: 3 },
  resultServing: { fontSize: 12, color: "#6b7a99" },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  scoreBarBg: { flex: 1, height: 4, backgroundColor: "#1e2535", borderRadius: 2, overflow: "hidden" },
  scoreBarFill: { height: "100%", borderRadius: 2 },
  scoreText: { fontSize: 10, color: "#6b7a99" },
  healthBadge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  healthBadgeText: { fontSize: 11, fontWeight: "700" },
  macroGrid: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#1e2535" },
  macroBox: { flex: 1, padding: 10, alignItems: "center", borderRightWidth: 1, borderRightColor: "#1e2535" },
  macroValue: { fontSize: 16, fontWeight: "700" },
  macroLabel: { fontSize: 9, color: "#6b7a99", textTransform: "uppercase", marginTop: 2 },
  extraRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#1e2535" },
  extraBox: { flex: 1, padding: "8px 14px", padding: 10 },
  extraLabel: { fontSize: 10, color: "#6b7a99" },
  extraValue: { fontSize: 13, fontWeight: "600", color: "#fff" },
  allergenBox: { padding: 10, backgroundColor: "rgba(255,107,107,0.06)", borderBottomWidth: 1, borderBottomColor: "#1e2535" },
  allergenText: { fontSize: 12, color: "#ff6b6b" },
  infoBox: { padding: 10, backgroundColor: "#0d1526", borderBottomWidth: 1, borderBottomColor: "#1e2535" },
  infoText: { fontSize: 12, color: "#6b7a99", lineHeight: 18 },
  btnPrimary: { backgroundColor: "#00e5a0", margin: 12, borderRadius: 10, padding: 13, alignItems: "center" },
  btnPrimaryText: { fontSize: 14, fontWeight: "700", color: "#0a0e1a" },
  historyCard: { backgroundColor: "#111827", borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: "#1e2535" },
  emptyBox: { padding: 40, alignItems: "center" },
  emptyEmoji: { fontSize: 36, marginBottom: 10 },
  emptyText: { fontSize: 14, color: "#6b7a99" },
  historyRow: { flexDirection: "row", alignItems: "flex-start", padding: 14, borderBottomWidth: 1, borderBottomColor: "#1e2535" },
  historyName: { fontSize: 13, fontWeight: "700", color: "#fff", marginBottom: 2 },
  historySub: { fontSize: 11, color: "#6b7a99", marginBottom: 6 },
  historyMacros: { flexDirection: "row", gap: 10 },
  historyMacroText: { fontSize: 11, color: "#6b7a99" },
  historyRight: { alignItems: "flex-end", gap: 8 },
  deleteBtn: { padding: 4 },
  deleteText: { color: "#ff6b6b", fontSize: 14, fontWeight: "700" },
});
