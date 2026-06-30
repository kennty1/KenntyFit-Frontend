import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import API from "../api/axios";

const PLANS = [
  { id: "trial", name: "Free Trial", price: 0, period: "7 days", color: "#00e5a0", badge: "START HERE", features: ["Full access for 7 days", "Meal & workout tracking", "5 food scans", "Progress tracking"] },
  { id: "monthly", name: "Monthly", price: 2000, period: "per month", color: "#0099ff", badge: "POPULAR", features: ["Everything in Trial", "Unlimited food scans", "Advanced charts", "Priority support"] },
  { id: "annual", name: "Annual", price: 18000, period: "per year", color: "#fbbf24", badge: "BEST VALUE", features: ["Everything in Monthly", "Save ₦6,000 vs monthly", "Export your data", "Early access features"] },
];

export default function Pricing() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [activeSub, setActiveSub] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  useEffect(() => {
    if (user?.id) API.get(`/subscriptions/user/${user.id}/check`).then(r => setActiveSub(r.data)).catch(() => {});
  }, [user?.id]);

  const handleSelect = async (plan) => {
    if (!isAuthenticated) { Alert.alert("Sign in required", "Please sign in first."); router.push("/login"); return; }
    if (!user?.id) { Alert.alert("Error", "User ID not found. Please sign in again."); return; }
    if (plan.id === "trial") {
      setLoading(true);
      try {
        await API.post(`/subscriptions/trial/${user.id}`);
        Alert.alert("Success! 🎉", "Free trial activated! You have 7 days of full access.", [
          { text: "Go to Dashboard", onPress: () => router.replace("/(tabs)") },
        ]);
      } catch (e) {
        Alert.alert("Error", e.response?.data?.message || "Could not activate trial.");
      } finally { setLoading(false); }
    } else {
      router.push({ pathname: "/payment", params: { planId: plan.id, planName: plan.name, planPrice: plan.price, planPeriod: plan.period } });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.badge}><Text style={styles.badgeText}>CHOOSE YOUR PLAN</Text></View>
          <Text style={styles.title}>Start your fitness journey today</Text>
          <Text style={styles.subtitle}>Begin with a 7-day free trial. No credit card required.</Text>
        </View>

        {activeSub?.active && (
          <View style={styles.activeSubCard}>
            <Text style={styles.activeSubText}>✅ You have an active subscription.</Text>
            <TouchableOpacity onPress={() => router.replace("/(tabs)")}>
              <Text style={styles.activeSubLink}>Go to Dashboard →</Text>
            </TouchableOpacity>
          </View>
        )}

        {PLANS.map((plan) => (
          <View key={plan.id} style={[styles.planCard, { borderColor: plan.id === "monthly" ? plan.color : "#1e2535" }]}>
            <View style={[styles.planBadge, { backgroundColor: plan.color }]}>
              <Text style={styles.planBadgeText}>{plan.badge}</Text>
            </View>
            <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.price}>{plan.price === 0 ? "Free" : `₦${plan.price.toLocaleString()}`}</Text>
              <Text style={styles.period}> {plan.period}</Text>
            </View>
            {plan.features.map((f) => (
              <View key={f} style={styles.featureRow}>
                <Text style={[styles.featureCheck, { color: plan.color }]}>✓</Text>
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
            <TouchableOpacity
              style={[styles.planBtn, plan.id === "monthly" ? { backgroundColor: plan.color } : { borderWidth: 2, borderColor: plan.color }]}
              onPress={() => handleSelect(plan)}
              disabled={loading}
            >
              {loading && plan.id === "trial" ? <ActivityIndicator color={plan.id === "monthly" ? "#0a0e1a" : plan.color} /> : (
                <Text style={[styles.planBtnText, { color: plan.id === "monthly" ? "#0a0e1a" : plan.color }]}>
                  {plan.price === 0 ? "Start Free Trial →" : `Subscribe ${plan.name} →`}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ))}

        <Text style={styles.footer}>🔒 Secured by Paystack · Cancel anytime · No hidden fees</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0e1a" },
  container: { padding: 20, paddingBottom: 40 },
  backBtn: { marginBottom: 16 },
  backText: { color: "#6b7a99", fontSize: 14 },
  header: { alignItems: "center", marginBottom: 28 },
  badge: { backgroundColor: "rgba(0,229,160,0.1)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4, borderWidth: 1, borderColor: "rgba(0,229,160,0.3)", marginBottom: 12 },
  badgeText: { fontSize: 10, fontWeight: "800", color: "#00e5a0", letterSpacing: 1 },
  title: { fontSize: 26, fontWeight: "800", color: "#fff", textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 13, color: "#6b7a99", textAlign: "center" },
  activeSubCard: { backgroundColor: "rgba(0,229,160,0.08)", borderRadius: 10, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: "rgba(0,229,160,0.3)" },
  activeSubText: { fontSize: 13, color: "#00e5a0", marginBottom: 4 },
  activeSubLink: { fontSize: 13, color: "#00e5a0", fontWeight: "700", textDecorationLine: "underline" },
  planCard: { backgroundColor: "#111827", borderRadius: 18, padding: 24, marginBottom: 16, borderWidth: 1, position: "relative", paddingTop: 28 },
  planBadge: { position: "absolute", top: -10, left: 20, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  planBadgeText: { fontSize: 9, fontWeight: "800", color: "#0a0e1a", letterSpacing: 1 },
  planName: { fontSize: 20, fontWeight: "800", marginBottom: 8 },
  priceRow: { flexDirection: "row", alignItems: "baseline", marginBottom: 16 },
  price: { fontSize: 32, fontWeight: "900", color: "#fff" },
  period: { fontSize: 13, color: "#6b7a99" },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  featureCheck: { fontSize: 14, fontWeight: "700" },
  featureText: { fontSize: 13, color: "#fff" },
  planBtn: { marginTop: 16, borderRadius: 10, padding: 14, alignItems: "center" },
  planBtnText: { fontSize: 14, fontWeight: "700" },
  footer: { textAlign: "center", color: "#6b7a99", fontSize: 12, marginTop: 8 },
});
