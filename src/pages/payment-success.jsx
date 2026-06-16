import React, { useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";

export default function PaymentSuccess() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  // Reference may come from deep link params or stored pending payment
  const reference = params.reference || params.trxref || null;

  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const confirmSubscription = async () => {
      try {
        const pendingRaw = await AsyncStorage.getItem("pendingPayment");
        const pending = pendingRaw ? JSON.parse(pendingRaw) : null;
        const pendingReference = reference || pending?.reference;
        const pendingPlan = pending?.plan;
        const pendingUserId = pending?.userId || user?.id;

        if (pendingReference) {
          await API.post("/subscriptions/verify", {
            reference: pendingReference,
            userId: pendingUserId || null,
            plan: pendingPlan || null,
          });
        }

        if (user?.id) {
          const res = await API.get(`/subscriptions/user/${user.id}`);
          if (!cancelled) setSub(res.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || "Unable to confirm payment.");
          if (user?.id) {
            API.get(`/subscriptions/user/${user.id}`)
              .then((r) => setSub(r.data))
              .catch(() => {});
          }
        }
      } finally {
        if (!cancelled) {
          await AsyncStorage.removeItem("pendingPayment");
          setLoading(false);
        }
      }
    };

    confirmSubscription();
    return () => { cancelled = true; };
  }, [user?.id, reference]);

  // Countdown redirect
  useEffect(() => {
    if (loading) return;
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(t); router.replace("/(tabs)"); }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [loading]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#00e5a0" />
          <Text style={styles.loadingText}>Confirming subscription...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const planName = sub?.plan || "Monthly";
  const endDate = sub?.endDate || "30 days";
  const daysLeft = sub?.daysRemaining || 30;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Success icon */}
        <View style={styles.successIcon}>
          <Text style={styles.successEmoji}>✅</Text>
        </View>

        <Text style={styles.title}>Payment Successful!</Text>
        <Text style={styles.subtitle}>
          Your <Text style={styles.planHighlight}>{planName}</Text> subscription is now active. Welcome!
        </Text>

        {error ? <View style={styles.alertError}><Text style={styles.alertText}>⚠️ {error}</Text></View> : null}

        {/* Subscription details */}
        <View style={styles.detailCard}>
          {[
            ["Plan", planName],
            ["Status", "Active ✓"],
            ["Expires", endDate],
            ["Days Left", `${daysLeft} days`],
            ...(reference ? [["Reference", reference]] : []),
          ].map(([k, v]) => (
            <View key={k} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{k}</Text>
              <Text style={[styles.detailValue, k === "Status" && { color: "#00e5a0" }]}>{v}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.btnPrimary} onPress={() => router.replace("/(tabs)")}>
          <Text style={styles.btnPrimaryText}>Go to Dashboard →</Text>
        </TouchableOpacity>

        <Text style={styles.countdownText}>
          Redirecting in <Text style={styles.countdownNum}>{countdown}</Text> second{countdown !== 1 ? "s" : ""}...
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0e1a" },
  container: { flex: 1, padding: 24, alignItems: "center", justifyContent: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  loadingText: { color: "#6b7a99", fontSize: 14, marginTop: 12 },
  successIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: "rgba(0,229,160,0.1)", borderWidth: 2, borderColor: "#00e5a0", alignItems: "center", justifyContent: "center", marginBottom: 24 },
  successEmoji: { fontSize: 40 },
  title: { fontSize: 26, fontWeight: "800", color: "#fff", marginBottom: 10, textAlign: "center" },
  subtitle: { fontSize: 14, color: "#6b7a99", lineHeight: 22, marginBottom: 24, textAlign: "center" },
  planHighlight: { color: "#00e5a0", fontWeight: "700" },
  alertError: { backgroundColor: "rgba(255,107,107,0.1)", borderRadius: 8, padding: 12, marginBottom: 16, width: "100%", borderWidth: 1, borderColor: "rgba(255,107,107,0.3)" },
  alertText: { color: "#ff6b6b", fontSize: 13 },
  detailCard: { backgroundColor: "#111827", borderRadius: 14, padding: 16, width: "100%", marginBottom: 20, borderWidth: 1, borderColor: "#1e2535" },
  detailRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#1e2535" },
  detailLabel: { fontSize: 14, color: "#6b7a99" },
  detailValue: { fontSize: 14, fontWeight: "700", color: "#fff" },
  btnPrimary: { backgroundColor: "#00e5a0", borderRadius: 12, padding: 15, alignItems: "center", width: "100%", marginBottom: 14 },
  btnPrimaryText: { fontSize: 15, fontWeight: "700", color: "#0a0e1a" },
  countdownText: { fontSize: 12, color: "#6b7a99" },
  countdownNum: { fontWeight: "700", color: "#fff" },
});
