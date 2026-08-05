import React, { useState, useCallback, useMemo } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import API from "../api/axios";

export default function SubscriptionGuard({ children }) {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [checking, setChecking] = useState(true);
  const [active, setActive] = useState(false);
  const [subInfo, setSubInfo] = useState(null);

  // useFocusEffect fires every time this screen comes into focus —
  // including when the user returns from the Paystack browser after payment.
  // Run async logic inside the effect callback and return a cleanup (no Promise).
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const run = async () => {
        if (!user?.id) {
          if (isActive) setChecking(false);
          return;
        }
        if (isActive) setChecking(true);
        try {
          const res = await API.get(`/subscriptions/user/${user.id}/access`);
          if (!isActive) return;
          const data = res.data;
          if (isActive) setActive(data?.hasAccess === true);
          if (data?.hasAccess) {
            try {
              const subRes = await API.get(`/subscriptions/user/${user.id}`);
              if (isActive) setSubInfo(subRes.data);
            } catch {
              if (isActive) setSubInfo({ plan: data.plan, daysRemaining: data.daysRemaining });
            }
          } else {
            if (isActive) setSubInfo(null);
          }
        } catch {
          if (isActive) {
            setActive(false);
            setSubInfo(null);
          }
        } finally {
          if (isActive) setChecking(false);
        }
      };

      run();

      return () => { isActive = false; };
    }, [user?.id])
  );

  const handleSignInDifferentAccount = async () => {
    try { await logout(); } catch {}
    router.replace("/login");
  };

  const styles = useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.background },
    center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background, gap: 12 },
    checkingText: { color: theme.muted, fontSize: 14 },
    expiryBanner: { backgroundColor: `${theme.warning}1A`, borderBottomWidth: 1, borderBottomColor: theme.warning, paddingTop: insets.top + 8, paddingBottom: 12, paddingHorizontal: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4, marginHorizontal: 10, borderRadius: 10, marginBottom: 8 },
    expiryText: { fontSize: 13, color: theme.warning, flex: 1 },
    bold: { fontWeight: "700" },
    renewBtn: { backgroundColor: theme.warning, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5, marginLeft: 10 },
    renewBtnText: { fontSize: 11, fontWeight: "700", color: theme.background },
    lockedContainer: { flex: 1, padding: 24, alignItems: "center", justifyContent: "center" },
    lockIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: `${theme.accent}1A`, alignItems: "center", justifyContent: "center", marginBottom: 20 },
    lockedTitle: { fontSize: 26, fontWeight: "800", color: theme.text, marginBottom: 12, textAlign: "center" },
    lockedSub: { fontSize: 14, color: theme.muted, lineHeight: 22, marginBottom: 28, textAlign: "center" },
    featureCard: { backgroundColor: theme.surface, borderRadius: 14, padding: 16, width: "100%", marginBottom: 20, borderWidth: 1, borderColor: theme.border },
    featureRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
    featureIcon: { fontSize: 18, width: 26 },
    featureText: { fontSize: 14, color: theme.text, flex: 1 },
    featureCheck: { color: theme.accent, fontSize: 14, fontWeight: "700" },
    btnPrimary: { backgroundColor: theme.accent, borderRadius: 12, padding: 15, alignItems: "center", width: "100%", marginBottom: 10 },
    btnPrimaryText: { fontSize: 15, fontWeight: "700", color: theme.accentText },
    btnGhost: { borderRadius: 12, padding: 13, alignItems: "center", width: "100%", borderWidth: 1, borderColor: theme.border },
    btnGhostText: { fontSize: 14, color: theme.muted, fontWeight: "600" },
  }), [theme]);

  if (checking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={styles.checkingText}>Checking subscription...</Text>
      </View>
    );
  }

  // Expiry warning banner — shows above content if expiring within 3 days
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

  // No active subscription — full paywall
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
          <Text style={styles.btnPrimaryText}>View Plans & Subscribe →</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnGhost} onPress={handleSignInDifferentAccount}>
          <Text style={styles.btnGhostText}>Sign in to a different account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
