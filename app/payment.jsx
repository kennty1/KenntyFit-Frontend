import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Linking, Alert, Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";

const getPaymentCallbackUrl = () => {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.location?.origin) {
      return `${window.location.origin}/payment-success`;
    }
    return "https://api.paystack.com/api/payment/callback";
  }

  return "kenntyfit://payment-success";
};

export default function Payment() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  
  const plan = {
    id: params.planId || "monthly",
    name: params.planName || "Monthly",
    price: parseInt(params.planPrice) || 2000,
    period: params.planPeriod || "per month",
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePay = async () => {
    if (!plan?.id || !user?.id) {
      Alert.alert("Error", "Missing payment details");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const callbackUrl = getPaymentCallbackUrl();

      console.log("💳 Initializing payment with:", {
        userId: user.id,
        email: user.email,
        plan: plan.id.toUpperCase(),
        amount: plan.price,
      });

      // ✅ Call backend to initialize payment
      const response = await API.post("/subscriptions/initialize", {
        userId: user.id,
        email: user.email,
        plan: plan.id.toUpperCase(),
        amount: plan.price,
      });

      const { authorizationUrl, reference } = response.data || {};

      console.log("✅ Payment initialized:", { reference, authorizationUrl });

      // ✅ Save pending payment to AsyncStorage
      await AsyncStorage.setItem("pendingPayment", JSON.stringify({
        userId: user.id,
        email: user.email,
        plan: plan.id.toUpperCase(),
        amount: plan.price,
        planName: plan.name,
        reference,
        source: "mobile-app",
      }));

      // ✅ Open Paystack checkout URL
      if (authorizationUrl) {
        console.log("🔗 Opening Paystack checkout...");
        await Linking.openURL(authorizationUrl);
        return;
      }

      // ✅ Fallback: Navigate to success screen
      console.log("⚠️ No authorization URL, navigating to success screen");
      router.replace({
        pathname: "/payment-success",
        params: {
          ref: reference || `local-${Date.now()}`,
          plan: plan.id.toUpperCase(),
          planName: plan.name,
          amount: plan.price,
        },
      });

    } catch (err) {
      console.error("❌ Payment initialization error:", err);

      const errorMessage = err.response?.data?.message || err.message || "Payment initialization failed";
      setError(errorMessage);

      // ✅ Fallback: Still save pending payment for retry
      const fallbackReference = `local-${Date.now()}`;
      await AsyncStorage.setItem("pendingPayment", JSON.stringify({
        userId: user.id,
        email: user.email,
        plan: plan.id.toUpperCase(),
        amount: plan.price,
        planName: plan.name,
        reference: fallbackReference,
        source: "fallback",
      }));

      Alert.alert("Error", errorMessage, [
        { text: "Try Again", onPress: () => setError("") },
        { text: "Continue Anyway", onPress: () => {
          router.replace({
            pathname: "/payment-success",
            params: {
              ref: fallbackReference,
              plan: plan.id.toUpperCase(),
              planName: plan.name,
              amount: plan.price,
            },
          });
        }},
      ]);

    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.card}>
          
          {/* Header */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>💳</Text>
            <Text style={styles.cardTitle}>Complete Payment</Text>
            <Text style={styles.cardSub}>
              Subscribing to the <Text style={styles.planHighlight}>{plan.name}</Text> plan
            </Text>
          </View>

          {/* Details */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Plan</Text>
            <Text style={styles.detailValue}>{plan.name}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>{plan.period}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={[styles.detailValue, { color: "#0099ff", fontSize: 20 }]}>
              ₦{plan.price.toLocaleString()}
            </Text>
          </View>

          {/* Error Alert */}
          {error ? (
            <View style={styles.alertError}>
              <Text style={styles.alertText}>⚠️ {error}</Text>
            </View>
          ) : null}

          {/* Pay Button */}
          <TouchableOpacity 
            style={styles.payBtn} 
            onPress={handlePay} 
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#0a0e1a" size="small" />
            ) : (
              <Text style={styles.payBtnText}>
                Pay ₦{plan.price.toLocaleString()} with Paystack →
              </Text>
            )}
          </TouchableOpacity>

          {/* Security Note */}
          <Text style={styles.secureText}>
            🔒 Secured by Paystack · You will be redirected to checkout
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0e1a" },
  container: { flex: 1, padding: 20 },
  card: { 
    backgroundColor: "#111827", 
    borderRadius: 16, 
    padding: 24, 
    borderWidth: 1, 
    borderColor: "#1e2535" 
  },
  cardHeader: { 
    alignItems: "center", 
    paddingBottom: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: "#1e2535", 
    marginBottom: 20 
  },
  cardIcon: { fontSize: 36, marginBottom: 10 },
  cardTitle: { fontSize: 22, fontWeight: "800", color: "#fff", marginBottom: 6 },
  cardSub: { fontSize: 13, color: "#6b7a99" },
  planHighlight: { color: "#0099ff", fontWeight: "700" },
  detailRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 14 
  },
  detailLabel: { fontSize: 14, color: "#6b7a99" },
  detailValue: { fontSize: 14, fontWeight: "700", color: "#fff" },
  alertError: { 
    backgroundColor: "rgba(252,129,129,0.1)", 
    borderRadius: 8, 
    padding: 12, 
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(255,107,107,0.3)",
  },
  alertText: { color: "#ff6b6b", fontSize: 13 },
  payBtn: { 
    backgroundColor: "#00e5a0", 
    borderRadius: 12, 
    padding: 16, 
    alignItems: "center", 
    marginTop: 8 
  },
  payBtnText: { fontSize: 15, fontWeight: "700", color: "#0a0e1a" },
  secureText: { textAlign: "center", marginTop: 14, fontSize: 11, color: "#6b7a99" },
});