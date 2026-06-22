import React, { useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";

export default function SubscriptionGuard({ children }) {
  const { user } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [active, setActive] = useState(false);
  const [subInfo, setSubInfo] = useState(null);

  useEffect(() => {
    if (!user?.id) { setChecking(false); return; }
    API.get(`/subscriptions/user/${user.id}/check`)
      .then((res) => {
        setActive(res.data?.active === true);
        return API.get(`/subscriptions/user/${user.id}`).catch(() => null);
      })
      .then((res) => { if (res) setSubInfo(res.data); })
      .catch(() => setActive(false))
      .finally(() => setChecking(false));
  }, [user?.id]);

  if (checking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00e5a0" />
        <Text style={styles.checkingText}>Checking subscription...</Text>
      </View>
    );
  }

  // Expiry warning banner — show above content if expiring soon
  if (active && subInfo?.daysRemaining <= 3 && subInfo?.daysRemaining > 0) {
    return (
      <View style={{ flex: 1 }}>
        <View style={styles.expiryBanner}>
          <Text style={styles.expiryText}>
            ⚠️ Your <Text style={styles.bold}>{subInfo.plan}</Text> plan expires in{" "}
            <Text style={styles.bold}>{subInfo.daysRemaining} day(s)</Text>.
          </Text>
          <TouchableOpacity style={styles.renewBtn} onPress={() => router.push("/pricing")}>
            <Text style={styles.renewBtnText}>Renew</Text>
          </TouchableOpacity>
        </View>
        {children}
      </View>
    );
  }

  if (active) return children;

  // No active subscription
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.lockedContainer}>
        <View style={styles.lockIcon}>
          <Text style={{ fontSize: 32 }}>🔒</Text>
        </View>
        <Text style={styles.lockedTitle}>Subscription Required</Text>
        <Text style={styles.lockedSub}>
          Start with a free 7-day trial — no credit card required.
        </Text>

        <View style={styles.featureCard}>
          {[["🥗", "Meal tracking"], ["🏋️", "Workout logging"], ["💧", "Water monitoring"], ["📈", "Progress charts"], ["🔍", "AI food scanner"]].map(([icon, text]) => (
            <View key={text} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{icon}</Text>
              <Text style={styles.featureText}>{text}</Text>
              <Text style={styles.featureCheck}>✓</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.btnPrimary} onPress={() => router.push("/pricing")}>
          <Text style={styles.btnPrimaryText}>View Plans & Start Free Trial →</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnGhost} onPress={() => router.push("/login")}>
          <Text style={styles.btnGhostText}>Sign in to a different account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0e1a" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0a0e1a", gap: 12 },
  checkingText: { color: "#6b7a99", fontSize: 14 },
  expiryBanner: { backgroundColor: "rgba(246,173,85,0.1)", borderBottomWidth: 1, borderBottomColor: "#f6ad55", padding: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  expiryText: { fontSize: 13, color: "#f6ad55", flex: 1 },
  bold: { fontWeight: "700" },
  renewBtn: { backgroundColor: "#f6ad55", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5, marginLeft: 10 },
  renewBtnText: { fontSize: 11, fontWeight: "700", color: "#0a0e1a" },
  lockedContainer: { flex: 1, padding: 24, alignItems: "center", justifyContent: "center" },
  lockIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(0,153,255,0.1)", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  lockedTitle: { fontSize: 26, fontWeight: "800", color: "#fff", marginBottom: 12, textAlign: "center" },
  lockedSub: { fontSize: 14, color: "#6b7a99", lineHeight: 22, marginBottom: 28, textAlign: "center" },
  featureCard: { backgroundColor: "#111827", borderRadius: 14, padding: 16, width: "100%", marginBottom: 20, borderWidth: 1, borderColor: "#1e2535" },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  featureIcon: { fontSize: 18, width: 26 },
  featureText: { fontSize: 14, color: "#fff", flex: 1 },
  featureCheck: { color: "#00e5a0", fontSize: 14, fontWeight: "700" },
  btnPrimary: { backgroundColor: "#00e5a0", borderRadius: 12, padding: 15, alignItems: "center", width: "100%", marginBottom: 10 },
  btnPrimaryText: { fontSize: 15, fontWeight: "700", color: "#0a0e1a" },
  btnGhost: { borderRadius: 12, padding: 13, alignItems: "center", width: "100%", borderWidth: 1, borderColor: "#1e2535" },
  btnGhostText: { fontSize: 14, color: "#6b7a99", fontWeight: "600" },
});
