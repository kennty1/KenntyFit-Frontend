import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, ActivityIndicator,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";

const PLANS = [
  {
    id: "trial",
    name: "Free Trial",
    price: 0,
    period: "7 days",
    color: "#00e5a0",
    badge: "START HERE",
    features: ["Full access for 7 days", "Meal & workout tracking", "5 food scans", "Progress tracking"],
  },
  {
    id: "monthly",
    name: "Monthly",
    price: 2000,
    period: "per month",
    color: "#0099ff",
    badge: "POPULAR",
    features: ["Everything in Trial", "Unlimited food scans", "Advanced charts", "Priority support"],
  },
  {
    id: "annual",
    name: "Annual",
    price: 18000,
    period: "per year",
    color: "#fbbf24",
    badge: "BEST VALUE",
    features: ["Everything in Monthly", "Save ₦6,000 vs monthly", "Export your data", "Early access features"],
  },
];

export default function Pricing() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [trialBlocked, setTrialBlocked] = useState(false);

  // ✅ Check subscription on screen focus
  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        checkSubscription();
      }
    }, [user?.id])
  );

  const checkSubscription = async () => {
    try {
      // ✅ First check local cache
      const cached = await AsyncStorage.getItem("subscriptionSuccess");
      if (cached) {
        const parsed = JSON.parse(cached);
        const isRecent = Date.now() - (parsed?.updatedAt || 0) < 60 * 60 * 1000; // 1 hour
        if (isRecent && parsed?.active) {
          setSubscription(parsed);
          setTrialBlocked(true);
          return;
        }
      }

      // ✅ Check backend for active subscription
      console.log("🔎 Checking subscription for user:", user.id);
      
      const response = await API.get(`/subscriptions/user/${user.id}/access`);
      const data = response.data;

      console.log("✅ Access check response:", data);

      if (data?.hasAccess) {
        // ✅ User has active subscription
        setSubscription({
          active: true,
          plan: data.plan,
          daysRemaining: data.daysRemaining,
          status: data.status,
        });
        setTrialBlocked(true);
      } else {
        // ✅ No active subscription
        setSubscription(null);
        setTrialBlocked(data?.status === "TRIAL" || data?.plan === "TRIAL");
      }

    } catch (err) {
      console.error("❌ Error checking subscription:", err);
      setSubscription(null);
      setTrialBlocked(false);
    }
  };

  const handleTrialSelect = async () => {
    if (!isAuthenticated) {
      Alert.alert("Sign in required", "Please sign in first.");
      router.push("/login");
      return;
    }

    if (!user?.id) {
      Alert.alert("Error", "User ID not found. Please sign in again.");
      return;
    }

    if (trialBlocked) {
      Alert.alert(
        "Trial already used",
        "Your 7-day trial has already been used. Choose a monthly or annual plan to continue using the app."
      );
      return;
    }

    setLoading(true);

    try {
      console.log("🎯 Activating trial for user:", user.id);

      // ✅ Call backend to activate trial
      const response = await API.post(`/subscriptions/trial/${user.id}`);

      console.log("✅ Trial activated:", response.data);

      // ✅ Save to AsyncStorage
      await AsyncStorage.setItem("subscriptionSuccess", JSON.stringify({
        active: true,
        plan: "TRIAL",
        daysRemaining: 7,
        updatedAt: Date.now(),
      }));

      setSubscription(response.data);
      setTrialBlocked(true);

      Alert.alert("Success! 🎉", "Free trial activated! You have 7 days of full access.", [
        { text: "Go to Dashboard", onPress: () => router.replace("/(tabs)") },
      ]);

    } catch (err) {
      console.error("❌ Trial activation error:", err);

      const message = err.response?.data?.message || "Could not activate trial.";

      if (message.toLowerCase().includes("already used") || message.toLowerCase().includes("trial")) {
        setTrialBlocked(true);
        Alert.alert(
          "Trial already used",
          "Your 7-day free trial has already been used. Choose a monthly or annual plan to continue access."
        );
      } else {
        Alert.alert("Error", message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePaidSelect = (plan) => {
    if (!isAuthenticated) {
      Alert.alert("Sign in required", "Please sign in first.");
      router.push("/login");
      return;
    }

    if (!user?.id) {
      Alert.alert("Error", "User ID not found. Please sign in again.");
      return;
    }

    // ✅ Navigate to payment screen
    router.push({
      pathname: "/payment",
      params: {
        planId: plan.id,
        planName: plan.name,
        planPrice: plan.price,
        planPeriod: plan.period,
      },
    });
  };

  const handlePlanSelect = (plan) => {
    if (plan.id === "trial") {
      handleTrialSelect();
    } else {
      handlePaidSelect(plan);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>CHOOSE YOUR PLAN</Text>
          </View>
          <Text style={styles.title}>Start your fitness journey today</Text>
          <Text style={styles.subtitle}>
            {trialBlocked
              ? "Your trial has already been used. Choose a monthly or annual plan to continue access."
              : "Begin with a 7-day free trial. No credit card required."}
          </Text>
        </View>

        {/* Active Subscription Alert */}
        {subscription?.active && (
          <View style={styles.activeSubCard}>
            <Text style={styles.activeSubText}>✅ You have an active subscription.</Text>
            <TouchableOpacity onPress={() => router.replace("/(tabs)")}>
              <Text style={styles.activeSubLink}>Go to Dashboard →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Plans */}
        {PLANS.map((plan) => (
          <View
            key={plan.id}
            style={[
              styles.planCard,
              { borderColor: plan.id === "monthly" ? plan.color : "#1e2535" },
            ]}
          >
            {/* Badge */}
            <View style={[styles.planBadge, { backgroundColor: plan.color }]}>
              <Text style={styles.planBadgeText}>{plan.badge}</Text>
            </View>

            {/* Plan Name */}
            <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>

            {/* Price */}
            <View style={styles.priceRow}>
              <Text style={styles.price}>
                {plan.price === 0 ? "Free" : `₦${plan.price.toLocaleString()}`}
              </Text>
              <Text style={styles.period}> {plan.period}</Text>
            </View>

            {/* Features */}
            {plan.features.map((feature) => (
              <View key={feature} style={styles.featureRow}>
                <Text style={[styles.featureCheck, { color: plan.color }]}>✓</Text>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}

            {/* Button */}
            <TouchableOpacity
              style={[
                styles.planBtn,
                plan.id === "monthly"
                  ? { backgroundColor: plan.color }
                  : { borderWidth: 2, borderColor: plan.color },
              ]}
              onPress={() => handlePlanSelect(plan)}
              disabled={loading || (plan.id === "trial" && trialBlocked)}
              activeOpacity={0.8}
            >
              {loading && plan.id === "trial" ? (
                <ActivityIndicator color={plan.id === "monthly" ? "#0a0e1a" : plan.color} />
              ) : (
                <Text
                  style={[
                    styles.planBtnText,
                    { color: plan.id === "monthly" ? "#0a0e1a" : plan.color },
                  ]}
                >
                  {plan.price === 0
                    ? trialBlocked
                      ? "Trial already used"
                      : "Start Free Trial →"
                    : `Subscribe ${plan.name} →`}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ))}

        {/* Footer */}
        <Text style={styles.footer}>
          🔒 Secured by Paystack · Cancel anytime · No hidden fees
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0e1a" },
  container: { padding: 20, paddingBottom: 40 },
  header: { alignItems: "center", marginBottom: 28 },
  badge: {
    backgroundColor: "rgba(0,229,160,0.1)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(0,229,160,0.3)",
    marginBottom: 12,
  },
  badgeText: { fontSize: 10, fontWeight: "800", color: "#00e5a0", letterSpacing: 1 },
  title: { fontSize: 26, fontWeight: "800", color: "#fff", textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 13, color: "#6b7a99", textAlign: "center" },
  activeSubCard: {
    backgroundColor: "rgba(0,229,160,0.08)",
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(0,229,160,0.3)",
  },
  activeSubText: { fontSize: 13, color: "#00e5a0", marginBottom: 4 },
  activeSubLink: { fontSize: 13, color: "#00e5a0", fontWeight: "700", textDecorationLine: "underline" },
  planCard: {
    backgroundColor: "#111827",
    borderRadius: 18,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    position: "relative",
    paddingTop: 28,
  },
  planBadge: {
    position: "absolute",
    top: -10,
    left: 20,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
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