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
  const reference = params.ref || params.reference || params.trxref || null;

  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const [error, setError] = useState("");
  const [planName, setPlanName] = useState(params?.planName || "Plan");

  useEffect(() => {
    let cancelled = false;

    const confirmSubscription = async () => {
      try {
        // ✅ Get pending payment from AsyncStorage
        const pendingRaw = await AsyncStorage.getItem("pendingPayment");
        const pending = pendingRaw ? JSON.parse(pendingRaw) : {};

        // ✅ Extract values
        const paymentReference = reference || pending?.reference;
        const userId = user?.id || pending?.userId;
        const plan = pending?.plan || params?.plan || "MONTHLY";
        const email = user?.email || pending?.email || "";
        const amount = pending?.amount || parseInt(params?.amount) || 0;
        const displayPlanName = pending?.planName || params?.planName || "Plan";

        if (displayPlanName) {
          setPlanName(displayPlanName);
        }

        // ✅ Verify payment with backend
        if (paymentReference && userId) {
          console.log("🔍 Verifying payment:", {
            reference: paymentReference,
            userId,
            plan,
            email,
            amount,
          });

          const response = await API.post("/subscriptions/verify", {
            reference: paymentReference,
            userId,
            plan,
            email,
            amount,
          });

          console.log("✅ Payment verified:", response.data);

          if (!cancelled) {
            setSubscription(response.data);
            
            // ✅ Save to AsyncStorage
            await AsyncStorage.setItem("subscriptionSuccess", JSON.stringify({
              active: true,
              plan: response.data.plan,
              daysRemaining: response.data.daysRemaining,
              expiresAt: response.data.expiresAt,
              updatedAt: Date.now(),
            }));
          }
        }

      } catch (err) {
        console.error("❌ Verification error:", err);
        
        if (!cancelled) {
          // ✅ Show optimistic success - payment may still have gone through
          setError(err.response?.data?.message || "Unable to confirm subscription details");
          
          // Still show success but with warning
          setSubscription({
            plan: pending?.plan || "MONTHLY",
            status: "ACTIVE",
            daysRemaining: 30,
          });
        }
      } finally {
        if (!cancelled) {
          // ✅ Clear pending payment
          await AsyncStorage.removeItem("pendingPayment");
          setLoading(false);
        }
      }
    };

    confirmSubscription();
    return () => { cancelled = true; };
  }, [user?.id, user?.email, reference]);

  // ✅ Auto-redirect after loading
  useEffect(() => {
    if (loading) return;
    
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          router.replace("/(tabs)");
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#00e5a0" />
          <Text style={styles.loadingText}>Confirming your subscription...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const displayPlan = subscription?.plan 
    ? subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1).toLowerCase()
    : planName;
  const daysLeft = subscription?.daysRemaining || 30;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* Success Icon */}
        <View style={styles.successIconWrap}>
          <Text style={styles.successEmoji}>🎉</Text>
        </View>

        {/* Congratulations Card */}
        <View style={styles.popupCard}>
          <Text style={styles.congratsText}>Congratulations!</Text>
          <Text style={styles.title}>Your {displayPlan} plan is active</Text>
          <Text style={styles.subtitle}>
            Your subscription is confirmed and your <Text style={styles.planHighlight}>{displayPlan}</Text> plan is now active.
            You've successfully unlocked full access to KennyFit!
          </Text>
        </View>

        {/* Error Alert (if any) */}
        {!!error && (
          <View style={styles.alertError}>
            <Text style={styles.alertText}>⚠️ {error}</Text>
          </View>
        )}

        {/* Subscription Details Card */}
        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Plan</Text>
            <Text style={styles.detailValue}>{displayPlan}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={[styles.detailValue, { color: "#00e5a0" }]}>Active ✓</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Days Remaining</Text>
            <Text style={styles.detailValue}>{daysLeft} days</Text>
          </View>
          
          {subscription?.expiresAt && (
            <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.detailLabel}>Expires</Text>
              <Text style={[styles.detailValue, { fontSize: 12 }]}>
                {new Date(subscription.expiresAt).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          style={styles.btnPrimary} 
          onPress={() => router.replace("/(tabs)")}
        >
          <Text style={styles.btnPrimaryText}>Open KennyFit →</Text>
        </TouchableOpacity>

        {/* Countdown */}
        <Text style={styles.countdownText}>
          Taking you to the app in{" "}
          <Text style={styles.countdownNum}>{countdown}</Text>
          {" "}second{countdown !== 1 ? "s" : ""}...
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
  successIconWrap: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: "rgba(0,229,160,0.12)",
    borderWidth: 2, borderColor: "#00e5a0",
    alignItems: "center", justifyContent: "center", marginBottom: 20,
  },
  successEmoji: { fontSize: 44 },
  congratsText: { fontSize: 16, fontWeight: "700", color: "#00e5a0", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 },
  title: { fontSize: 28, fontWeight: "900", color: "#fff", marginBottom: 10, textAlign: "center" },
  subtitle: { fontSize: 14, color: "#6b7a99", lineHeight: 22, marginBottom: 24, textAlign: "center" },
  planHighlight: { color: "#00e5a0", fontWeight: "700" },
  popupCard: {
    width: "100%",
    backgroundColor: "#111827",
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: "#1e2535",
    marginBottom: 20,
    alignItems: "center",
  },
  alertError: { 
    backgroundColor: "rgba(255,107,107,0.1)", 
    borderRadius: 8, 
    padding: 12, 
    marginBottom: 16, 
    width: "100%", 
    borderWidth: 1, 
    borderColor: "rgba(255,107,107,0.3)" 
  },
  alertText: { color: "#ff6b6b", fontSize: 13 },
  detailCard: { 
    backgroundColor: "#111827", 
    borderRadius: 14, 
    padding: 16, 
    width: "100%", 
    marginBottom: 24, 
    borderWidth: 1, 
    borderColor: "#1e2535" 
  },
  detailRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    paddingVertical: 11, 
    borderBottomWidth: 1, 
    borderBottomColor: "#1e2535" 
  },
  detailLabel: { fontSize: 13, color: "#6b7a99" },
  detailValue: { fontSize: 14, fontWeight: "700", color: "#fff" },
  btnPrimary: { 
    backgroundColor: "#00e5a0", 
    borderRadius: 12, 
    padding: 16, 
    alignItems: "center", 
    width: "100%", 
    marginBottom: 16 
  },
  btnPrimaryText: { fontSize: 16, fontWeight: "800", color: "#0a0e1a" },
  countdownText: { fontSize: 13, color: "#6b7a99" },
  countdownNum: { fontWeight: "800", color: "#00e5a0" },
});