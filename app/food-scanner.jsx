import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Image, Alert, RefreshControl,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import API from "../api/axios";

const HEALTH = {
  HEALTHY:   { label: "Healthy",   color: "#00e5a0", bg: "rgba(0,229,160,0.15)" },
  MODERATE:  { label: "Moderate",  color: "#fbbf24", bg: "rgba(251,191,36,0.15)" },
  UNHEALTHY: { label: "Unhealthy", color: "#ff6b6b", bg: "rgba(255,107,107,0.15)" },
};

export default function FoodScanner() {
  const { user } = useAuth();
  const { theme } = useTheme();
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
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }] }>
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="barcode-scan" size={24} color={theme.accent} />
          <Text style={[styles.title, { color: theme.text }]}>Food Scanner</Text>
        </View>
        <Text style={[styles.sub, { color: theme.muted }]}>AI detects calories, macros & health rating instantly</Text>

        {/* Tab switcher */}
        <View style={styles.tabRow}>
          {[{ key: "scan", label: "Scan Food" }, { key: "history", label: "Scan History" }].map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[
                styles.tabBtn,
                { borderColor: theme.border, backgroundColor: theme.surface },
                activeTab === t.key && { backgroundColor: theme.accent, borderColor: theme.accent },
              ]}
              onPress={() => t.key === "history" ? loadHistory() : setActiveTab("scan")}
            >
              <Text style={[styles.tabText, { color: activeTab === t.key ? theme.accentText : theme.muted }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === "scan" && (
          <>
            {/* Upload area */}
            <View style={[styles.uploadCard, { backgroundColor: theme.surface, borderColor: theme.border }] }>
              {preview ? (
                <Image source={{ uri: preview }} style={styles.previewImage} resizeMode="cover" />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <View style={styles.uploadIconWrap}>
                    <MaterialCommunityIcons name="camera-plus-outline" size={32} color={theme.accent} />
                  </View>
                  <Text style={[styles.uploadTitle, { color: theme.text }]}>Take or upload a food photo</Text>
                  <Text style={[styles.uploadSub, { color: theme.muted }]}>AI will detect food and calculate nutrition</Text>
                </View>
              )}
              <View style={styles.uploadBtns}>
                <TouchableOpacity style={[styles.uploadBtn, { backgroundColor: theme.accent }]} onPress={takePhoto} disabled={scanning}>
                  <View style={styles.uploadBtnRow}>
                    <MaterialCommunityIcons name="camera-outline" size={16} color={theme.accentText} />
                    <Text style={[styles.uploadBtnText, { color: theme.accentText }]}>Camera</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.uploadBtn, styles.uploadBtnSecondary, { borderColor: theme.accent }]} onPress={pickFromLibrary} disabled={scanning}>
                  <View style={styles.uploadBtnRow}>
                    <MaterialCommunityIcons name="image-multiple-outline" size={16} color={theme.accent} />
                    <Text style={[styles.uploadBtnText, { color: theme.accent }]}>Gallery</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {error ? (
              <View style={styles.alertErrorRow}>
                <MaterialCommunityIcons name="alert-outline" size={16} color="#ff6b6b" />
                <Text style={styles.alertText}>{error}</Text>
              </View>
            ) : null}

            {/* Scanning indicator */}
            {scanning && (
              <View style={[styles.scanningCard, { backgroundColor: theme.surface, borderColor: theme.border }] }>
                <MaterialCommunityIcons name="robot-outline" size={36} color={theme.accent} style={styles.scanningIcon} />
                <Text style={[styles.scanningTitle, { color: theme.text }]}>Analyzing with Google Gemini AI...</Text>
                <Text style={[styles.scanningSub, { color: theme.muted }]}>Detecting food and calculating nutrients</Text>
                <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 12 }} />
              </View>
            )}

            {/* How it works */}
            {!scanning && !result && (
              <View style={[styles.howCard, { backgroundColor: theme.surface, borderColor: theme.border }] }>
                <Text style={[styles.howTitle, { color: theme.muted }]}>HOW IT WORKS</Text>
                {[["camera-outline", "Upload or take a food photo"], ["robot-outline", "Gemini AI identifies the food"], ["chart-box-outline", "Get calories, macros & health rating"], ["lightbulb-outline", "Use the result as meal guidance"]].map(([icon, text]) => (
                  <View key={text} style={styles.howRow}>
                    <MaterialCommunityIcons name={icon} size={18} color={theme.accent} style={styles.howIcon} />
                    <Text style={[styles.howText, { color: theme.muted }]}>{text}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Result card */}
            {result && !scanning && (
              <View style={[styles.resultCard, { backgroundColor: theme.surface, borderColor: theme.border }] }>
                {/* Header */}
                <View style={[styles.resultHeader, { borderBottomColor: theme.border }] }>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.resultFoodName, { color: theme.text }]}>{result.foodName}</Text>
                    <Text style={[styles.resultServing, { color: theme.muted }]}>{result.servingSize}{result.cookingMethod ? ` · ${result.cookingMethod}` : ""}</Text>
                    {result.healthScore && (
                      <View style={styles.scoreRow}>
                        <View style={[styles.scoreBarBg, { backgroundColor: theme.border }] }>
                          <View style={[styles.scoreBarFill, { width: `${result.healthScore}%`, backgroundColor: h?.color }]} />
                        </View>
                        <Text style={[styles.scoreText, { color: theme.muted }]}>Score: {result.healthScore}/100</Text>
                      </View>
                    )}
                  </View>
                  <View style={[styles.healthBadge, { backgroundColor: h?.bg }]}>
                    <Text style={[styles.healthBadgeText, { color: h?.color }]}>{h?.label}</Text>
                  </View>
                </View>

                {/* Macros */}
                <View style={[styles.macroGrid, { borderBottomColor: theme.border }] }>
                  {[
                    { l: "Calories", v: result.calories, c: "#ff6b6b" },
                    { l: "Protein", v: `${result.protein?.toFixed(1)}g`, c: "#0099ff" },
                    { l: "Carbs", v: `${result.carbs?.toFixed(1)}g`, c: "#fbbf24" },
                    { l: "Fats", v: `${result.fats?.toFixed(1)}g`, c: "#a78bfa" },
                    { l: "Fiber", v: `${result.fiber?.toFixed(1)}g`, c: "#00e5a0" },
                  ].map((m) => (
                    <View key={m.l} style={styles.macroBox}>
                      <Text style={[styles.macroValue, { color: m.c }]}>{m.v}</Text>
                      <Text style={[styles.macroLabel, { color: theme.muted }]}>{m.l}</Text>
                    </View>
                  ))}
                </View>

                {/* Sugar & Sodium */}
                {(result.sugar || result.sodium) && (
                  <View style={[styles.extraRow, { borderBottomColor: theme.border }] }>
                    {result.sugar && <View style={styles.extraBox}><Text style={[styles.extraLabel, { color: theme.muted }]}>Sugar</Text><Text style={[styles.extraValue, { color: theme.text }]}>{result.sugar?.toFixed(1)}g</Text></View>}
                    {result.sodium && <View style={styles.extraBox}><Text style={[styles.extraLabel, { color: theme.muted }]}>Sodium</Text><Text style={[styles.extraValue, { color: theme.text }]}>{result.sodium?.toFixed(0)}mg</Text></View>}
                  </View>
                )}

                {result.allergens && result.allergens !== "None" && (
                  <View style={[styles.allergenBox, { borderBottomColor: theme.border }] }>
                    <View style={styles.alertInlineRow}>
                      <MaterialCommunityIcons name="alert-outline" size={14} color="#ff6b6b" />
                      <Text style={styles.allergenText}>
                        Allergens: <Text style={{ color: theme.muted }}>{result.allergens}</Text>
                      </Text>
                    </View>
                  </View>
                )}

                {result.healthExplanation && (
                  <View style={[styles.infoBox, { borderBottomColor: theme.border }] }>
                    <Text style={[styles.infoText, { color: theme.muted }]}><Text style={{ color: theme.text, fontWeight: "700" }}>Assessment: </Text>{result.healthExplanation}</Text>
                  </View>
                )}

                {result.recommendation && (
                  <View style={[styles.infoBox, { borderBottomColor: theme.border }] }>
                    <Text style={[styles.infoText, { color: theme.muted }] }>
                      <Text style={{ color: theme.text, fontWeight: "700" }}>Tip: </Text>
                      {result.recommendation}
                    </Text>
                  </View>
                )}

                <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: theme.accent }]} onPress={() => { setResult(null); setPreview(null); }}>
                  <Text style={[styles.btnPrimaryText, { color: theme.accentText }]}>Scan Again</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* History tab */}
        {activeTab === "history" && (
          <View style={[styles.historyCard, { backgroundColor: theme.surface, borderColor: theme.border }] }>
            {loadHist ? (
              <ActivityIndicator size="large" color="#00e5a0" style={{ padding: 32 }} />
            ) : history.length === 0 ? (
              <View style={styles.emptyBox}>
                <MaterialCommunityIcons name="barcode-scan" size={36} color={theme.accent} style={styles.emptyIcon} />
                <Text style={[styles.emptyText, { color: theme.muted }]}>No scans yet. Scan your first food!</Text>
              </View>
            ) : (
              history.map((s) => {
                const hh = HEALTH[s.healthRating] || HEALTH.MODERATE;
                return (
                  <View key={s.id} style={[styles.historyRow, { borderBottomColor: theme.border }] }>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.historyName, { color: theme.text }]}>{s.foodName}</Text>
                      <Text style={[styles.historySub, { color: theme.muted }]}>{s.servingSize} · {new Date(s.scannedAt).toLocaleDateString()}</Text>
                      <View style={styles.historyMacros}>
                        <Text style={[styles.historyMacroText, { color: theme.muted }]}>🔥 {s.calories} kcal</Text>
                        <Text style={[styles.historyMacroText, { color: theme.muted }]}>🥩 {s.protein?.toFixed(1)}g</Text>
                        <Text style={[styles.historyMacroText, { color: theme.muted }]}>🌾 {s.carbs?.toFixed(1)}g</Text>
                      </View>
                    </View>
                    <View style={styles.historyRight}>
                      <View style={[styles.healthBadge, { backgroundColor: hh.bg }]}>
                        <Text style={[styles.healthBadgeText, { color: hh.color }]}>{hh.label}</Text>
                      </View>
                      <TouchableOpacity onPress={() => deleteHistoryItem(s.id)} style={styles.deleteBtn}>
                        <Text style={[styles.deleteText, { color: theme.danger }]}>✕</Text>
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
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
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
  uploadIconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,229,160,0.1)", marginBottom: 10 },
  uploadTitle: { fontSize: 15, fontWeight: "700", color: "#fff", marginBottom: 6 },
  uploadSub: { fontSize: 12, color: "#6b7a99", textAlign: "center" },
  uploadBtns: { flexDirection: "row", gap: 10, padding: 12 },
  uploadBtn: { flex: 1, backgroundColor: "#00e5a0", borderRadius: 8, padding: 12, alignItems: "center" },
  uploadBtnSecondary: { backgroundColor: "transparent", borderWidth: 1, borderColor: "#00e5a0" },
  uploadBtnRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  uploadBtnText: { fontSize: 13, fontWeight: "700", color: "#0a0e1a" },
  alertErrorRow: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,107,107,0.1)", borderRadius: 8, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: "rgba(255,107,107,0.3)" },
  alertError: { backgroundColor: "rgba(255,107,107,0.1)", borderRadius: 8, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: "rgba(255,107,107,0.3)" },
  alertText: { color: "#ff6b6b", fontSize: 13 },
  scanningCard: { backgroundColor: "#111827", borderRadius: 14, padding: 28, alignItems: "center", marginBottom: 16, borderWidth: 1, borderColor: "#1e2535" },
  scanningIcon: { marginBottom: 10 },
  scanningTitle: { fontSize: 14, fontWeight: "700", color: "#fff", marginBottom: 6 },
  scanningSub: { fontSize: 12, color: "#6b7a99" },
  howCard: { backgroundColor: "#111827", borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#1e2535" },
  howTitle: { fontSize: 11, fontWeight: "700", color: "#6b7a99", letterSpacing: 1, marginBottom: 14 },
  howRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  howIcon: { width: 20 },
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
  alertInlineRow: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  allergenText: { fontSize: 12, color: "#ff6b6b" },
  infoBox: { padding: 10, backgroundColor: "#0d1526", borderBottomWidth: 1, borderBottomColor: "#1e2535" },
  infoText: { fontSize: 12, color: "#6b7a99", lineHeight: 18 },
  btnPrimary: { backgroundColor: "#00e5a0", margin: 12, borderRadius: 10, padding: 13, alignItems: "center" },
  btnPrimaryText: { fontSize: 14, fontWeight: "700", color: "#0a0e1a" },
  historyCard: { backgroundColor: "#111827", borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: "#1e2535" },
  emptyBox: { padding: 40, alignItems: "center" },
  emptyIcon: { marginBottom: 10 },
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
