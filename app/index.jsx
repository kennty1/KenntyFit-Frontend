import React from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, ActivityIndicator,
  KeyboardAvoidingView, Platform, Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";


const highlights = [
  { title: "Workout plans", text: "Pick a routine, follow the timer, and stay in rhythm." },
  { title: "Hydration tracking", text: "Track your daily water intake and hit your goals." },
  { title: "Native reminders", text: "Alerts handled by the device on Android and iPhone." },
];

const stats = [
  { label: "Workouts", value: "6 types" },
  { label: "Hydration", value: "Track" },
  { label: "Reminders", value: "Device" },
  { label: "Progress", value: "Live" },
];

export default function Welcome() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Brand */}
        <View style={styles.brand}>
          <Image
  source={require("../profilephoto/kennty_logo_icon_dark.png")}
  style={styles.logo}
  resizeMode="contain"
/>
          <Text style={styles.appName}>KenntyFit</Text>
          <Text style={styles.tagline}>Your workout, water, and meal tracker in one app.</Text>
          <Text style={styles.subtitle}>
            Start with a clean mobile experience, then move into login when you're ready.
          </Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.statBox}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {user ? (
            <TouchableOpacity style={styles.btnPrimary} onPress={() => router.replace("/(tabs)")}>
              <Text style={styles.btnPrimaryText}>Open Dashboard →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.btnPrimary} onPress={() => router.push("/login")}>
              <Text style={styles.btnPrimaryText}>Sign In →</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.btnGhost}
            onPress={() => router.push({ pathname: "/login", params: { mode: "register" } })}
          >
            <Text style={styles.btnGhostText}>Create Account</Text>
          </TouchableOpacity>
        </View>

        {/* Highlights */}
        <View style={styles.highlights}>
          {highlights.map((item) => (
            <View key={item.title} style={styles.highlightCard}>
              <Text style={styles.highlightTitle}>{item.title}</Text>
              <Text style={styles.highlightText}>{item.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0e1a" },
  container: { padding: 24, paddingBottom: 40 },
  brand: { alignItems: "center", marginBottom: 32, marginTop: 20 },
   logo: {
  width: 72,
  height: 72,
  borderRadius: 20,
  marginBottom: 16,
},
  logoText: { fontSize: 32, fontWeight: "900", color: "#0a0e1a" },
  appName: { fontSize: 32, fontWeight: "800", color: "#ffffff", marginBottom: 10 },
  tagline: { fontSize: 17, fontWeight: "700", color: "#ffffff", textAlign: "center", marginBottom: 8, lineHeight: 24 },
  subtitle: { fontSize: 13, color: "#6b7a99", textAlign: "center", lineHeight: 20 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 28 },
  statBox: {
    flex: 1, backgroundColor: "#111827", borderRadius: 12,
    padding: 12, alignItems: "center", borderWidth: 1, borderColor: "#1e2535",
  },
  statValue: { fontSize: 14, fontWeight: "800", color: "#00e5a0", marginBottom: 2 },
  statLabel: { fontSize: 10, color: "#6b7a99", textTransform: "uppercase" },
  actions: { gap: 12, marginBottom: 32 },
  btnPrimary: {
    backgroundColor: "#00e5a0", borderRadius: 12,
    padding: 16, alignItems: "center",
  },
  btnPrimaryText: { fontSize: 16, fontWeight: "700", color: "#0a0e1a" },
  btnGhost: {
    borderRadius: 12, padding: 16, alignItems: "center",
    borderWidth: 1, borderColor: "#1e2535",
  },
  btnGhostText: { fontSize: 16, fontWeight: "600", color: "#6b7a99" },
  highlights: { gap: 12 },
  highlightCard: {
    backgroundColor: "#111827", borderRadius: 12,
    padding: 16, borderWidth: 1, borderColor: "#1e2535",
  },
  highlightTitle: { fontSize: 14, fontWeight: "700", color: "#ffffff", marginBottom: 4 },
  highlightText: { fontSize: 13, color: "#6b7a99", lineHeight: 18 },
});
