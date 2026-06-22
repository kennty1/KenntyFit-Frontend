import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Linking, Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";

export default function Payment() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const plan = {
    id: params.planId,
    name: params.planName,
    price: +params.planPrice,
    period: params.planPeriod,
  };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/pricing");
    }
  };

  const handlePay = async () => {
    if (!plan?.id || !user?.id) return;
    setError(""); setLoading(true);
    try {
      const response = await API.post("/subscriptions/initialize", {
        userId: user.id,
        plan: plan.id.toUpperCase(),
        callbackUrl: "kenntyfit://payment-success",
      });
      const { authorizationUrl, reference } = response.data;
      await AsyncStorage.setItem("pendingPayment", JSON.stringify({
        userId: user.id, plan: plan.id.toUpperCase(), reference,
      }));
      await Linking.openURL(authorizationUrl);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to open payment. Try again.");
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Back to Plans</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>💳</Text>
            <Text style={styles.cardTitle}>Complete Payment</Text>
            <Text style={styles.cardSub}>Subscribing to the <Text style={styles.planHighlight}>{plan.name}</Text> plan</Text>
          </View>

          {[["Plan", plan.name], ["Duration", plan.period], ["Amount", `₦${plan.price?.toLocaleString()}`]].map(([k, v]) => (
            <View key={k} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{k}</Text>
              <Text style={[styles.detailValue, k === "Amount" && { color: "#0099ff", fontSize: 20 }]}>{v}</Text>
            </View>
          ))}

          {error ? <View style={styles.alertError}><Text style={styles.alertText}>⚠️ {error}</Text></View> : null}

          <TouchableOpacity style={styles.payBtn} onPress={handlePay} disabled={loading}>
            {loading ? <ActivityIndicator color="#0a0e1a" /> : (
              <Text style={styles.payBtnText}>Pay ₦{plan.price?.toLocaleString()} with Paystack →</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.secureText}>🔒 Secured by Paystack · You will be redirected to checkout</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0e1a" },
  container: { flex: 1, padding: 20 },
  backBtn: { marginBottom: 20 },
  backText: { color: "#6b7a99", fontSize: 14 },
  card: { backgroundColor: "#111827", borderRadius: 16, padding: 24, borderWidth: 1, borderColor: "#1e2535" },
  cardHeader: { alignItems: "center", paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: "#1e2535", marginBottom: 20 },
  cardIcon: { fontSize: 36, marginBottom: 10 },
  cardTitle: { fontSize: 22, fontWeight: "800", color: "#fff", marginBottom: 6 },
  cardSub: { fontSize: 13, color: "#6b7a99" },
  planHighlight: { color: "#0099ff", fontWeight: "700" },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  detailLabel: { fontSize: 14, color: "#6b7a99" },
  detailValue: { fontSize: 14, fontWeight: "700", color: "#fff" },
  alertError: { backgroundColor: "rgba(252,129,129,0.1)", borderRadius: 8, padding: 12, marginBottom: 14 },
  alertText: { color: "#ff6b6b", fontSize: 13 },
  payBtn: { backgroundColor: "#00e5a0", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 8 },
  payBtnText: { fontSize: 15, fontWeight: "700", color: "#0a0e1a" },
  secureText: { textAlign: "center", marginTop: 14, fontSize: 11, color: "#6b7a99" },
});
