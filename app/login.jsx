import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform, Image,
  Modal, FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { COUNTRIES } from "../utils/countries";
import { useTheme } from "../context/ThemeContext";


const GENDERS = ["MALE", "FEMALE", "OTHER"];
const GOALS = ["WEIGHT LOSS", "MUSCLE GAIN", "MAINTAIN WEIGHT", "IMPROVE FITNESS"];
const ACTS = ["SEDENTARY", "LIGHTLY ACTIVE", "MODERATELY ACTIVE", "VERY ACTIVE", "EXTRA ACTIVE"];
const HEALTH_STATUSES = ["None", "Diabetes", "Hypertension", "High Cholesterol", "Vegetarian"];

const makeInitialForm = () => ({
  username: "", email: "", password: "", firstName: "", lastName: "", password: "",
  age: "", weight: "", height: "", gender: "MALE", fitnessGoal: "WEIGHT LOSS", HealthStatus: "None",
  activityLevel: "MODERATELY ACTIVE", dailyCalorieTarget: "2000",
  dailyWaterTarget: "2500", country: COUNTRIES[0], resetToken: "", newPassword: "", confirmPassword: "",
});

const getErrorMessage = (err, fallback) => {
  const data = err?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  if (data?.message) return data.message;
  if (data?.error) return data.error;
  if (data?.detail) return data.detail;
  if (err?.response?.status === 401) return "Invalid username/email or password.";
  if (err?.response?.status === 400) return data?.message || "Check the form values and try again.";
  if (err?.message === "Network Error") return "Cannot reach the server. Check your connection.";
  if (typeof err?.message === "string" && err.message.trim()) return err.message;
  return fallback;
};

function SelectField({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const shouldShowSearch = options.length > 8;
  const filteredOptions = options.filter((option) =>
    String(option).toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  return (
    <View style={[styles.formGroup, styles.selectField]}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.pickerButton} onPress={() => setOpen(true)}>
        <Text style={styles.pickerText}>{value || "Select"}</Text>
        <Text style={styles.pickerArrow}>▾</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>

            {shouldShowSearch && (
              <TextInput
                style={styles.searchInput}
                placeholder="Search"
                placeholderTextColor="#4a5568"
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
              />
            )}

            {filteredOptions.length > 0 ? (
              <FlatList
                data={filteredOptions}
                keyExtractor={(item) => String(item)}
                style={styles.optionList}
                contentContainerStyle={styles.optionListContent}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => {
                  const selected = value === item;
                  return (
                    <TouchableOpacity
                      style={[styles.optionItem, selected && styles.optionItemSelected]}
                      onPress={() => {
                        onChange(item);
                        setOpen(false);
                      }}
                    >
                      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{item}</Text>
                    </TouchableOpacity>
                  );
                }}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No matches found</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function Login() {
  const { login, register, verifyOtp, resendOtp,
    forgotPassword, resetPassword, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [mode, setMode] = useState(params.mode === "register" ? "register" : "login");
  const [otpMode, setOtpMode] = useState(false);
  const [form, setForm] = useState(makeInitialForm());
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/(tabs)");
    }
  }, [user, authLoading]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const openMode = (m) => { setMode(m); setOtpMode(false); setError(""); setSuccess(""); setOtp(""); };

  const handleSubmit = async () => {
    setError(""); setSuccess(""); setLoading(true);
    try {
      if (mode === "login") {
        if (!otpMode) {
          const res = await login(form.username, form.password);
          if (res?.otpRequired) {
            setOtpMode(true);
            setSuccess(res.message || "OTP sent to your email.");
            return;
          }
          router.replace("/(tabs)");
          return;
        }
        await verifyOtp(form.username, otp);
        router.replace("/(tabs)");
        return;
      }
      if (mode === "register") {
        await register(form.username, form.email, form.password, form);
        setSuccess("Account created! Check your email then sign in.");
        setMode("login"); setOtp(""); setForm(makeInitialForm());
        return;
      }
      if (mode === "forgot") {
        await forgotPassword(form.email);
        setSuccess("Password reset email sent. Check your inbox.");
        return;
      }
      if (mode === "reset") {
        await resetPassword(form.resetToken, form.newPassword, form.confirmPassword);
        setSuccess("Password reset! You can sign in now.");
        setMode("login");
        router.replace("/login");
      }
    } catch (err) {
      setError(getErrorMessage(err, "Something went wrong."));
    } finally { setLoading(false); }
  };

  const btnLabel = () => {
    if (loading) return "Please wait...";
    if (mode === "login") return otpMode ? "Verify OTP →" : "Sign In →";
    if (mode === "register") return "Create Account →";
    if (mode === "forgot") return "Send Reset Email →";
    return "Reset Password →";
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Image
              source={require("../profilephoto/kennty_logo_icon_dark.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.appName}>KenntyFit</Text>
            <Text style={styles.subtitle}>
              {mode === "login" ? "Welcome back. Sign in with your username or email to continue."
                : mode === "register" ? "Create your account to get started."
                : mode === "forgot" ? "Request a password reset email."
                : "Use your reset token to set a new password."}
            </Text>
          </View>

          {error ? <View style={styles.alertError}><Text style={styles.alertText}>⚠️ {error}</Text></View> : null}
          {success ? <View style={styles.alertSuccess}><Text style={styles.alertText}>✅ {success}</Text></View> : null}

          <View style={styles.card}>
            {mode === "register" && (
              <>
                <View style={styles.row}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Username</Text>
                    <TextInput style={styles.input} placeholder="your_username" placeholderTextColor="#4a5568" value={form.username} onChangeText={set("username")} autoCapitalize="none" />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput style={styles.input} placeholder="you@email.com" placeholderTextColor="#4a5568" value={form.email} onChangeText={set("email")} keyboardType="email-address" autoCapitalize="none" />
                  </View>
                </View>
                <View style={styles.row}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>First Name</Text>
                    <TextInput style={styles.input} placeholderTextColor="#4a5568" value={form.firstName} onChangeText={set("firstName")} />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Last Name</Text>
                    <TextInput style={styles.input} placeholderTextColor="#4a5568" value={form.lastName} onChangeText={set("lastName")} />
                  </View>
                   </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Password</Text>
                    <View style={styles.passwordRow}>
                      <TextInput
                        style={[styles.input, styles.passwordInput]}
                        placeholder="••••••••"
                        placeholderTextColor="#4a5568"
                        value={form.password}
                        onChangeText={set("password")}
                        secureTextEntry={!showPassword}
                      />
                      <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                        <Text style={styles.eyeIcon}>{showPassword ? "🙈" : "👁️"}</Text>
                      </TouchableOpacity>
                    </View> 
                  </View>
                
                <View style={styles.row}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Age</Text>
                    <TextInput style={styles.input} keyboardType="numeric" value={form.age} onChangeText={set("age")} placeholderTextColor="#4a5568" />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}> 
                    <Text style={styles.label}>Gender</Text>
                    <SelectField value={form.gender} options={GENDERS} onChange={set("gender")} />
                  </View>
                </View>
                <View style={styles.row}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Weight (kg)</Text>
                    <TextInput style={styles.input} keyboardType="decimal-pad" value={form.weight} onChangeText={set("weight")} placeholderTextColor="#4a5568" />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Height (m)</Text>
                    <TextInput style={styles.input} keyboardType="decimal-pad" value={form.height} onChangeText={set("height")} placeholderTextColor="#4a5568" />
                  </View>
                </View>
                <SelectField label="Fitness Goal" value={form.fitnessGoal} options={GOALS} onChange={set("fitnessGoal")} />
                <SelectField label="Activity Level" value={form.activityLevel} options={ACTS} onChange={set("activityLevel")} />
                <SelectField label="Country" value={form.country} options={COUNTRIES} onChange={set("country")} />
                <SelectField label="Health Status" value={form.HealthStatus} options={HEALTH_STATUSES} onChange={set("HealthStatus")} />
                <View style={styles.row}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Calorie Target</Text>
                    <TextInput style={styles.input} keyboardType="numeric" value={form.dailyCalorieTarget} onChangeText={set("dailyCalorieTarget")} placeholderTextColor="#4a5568" />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Water Target (ml)</Text>
                    <TextInput style={styles.input} keyboardType="numeric" value={form.dailyWaterTarget} onChangeText={set("dailyWaterTarget")} placeholderTextColor="#4a5568" />
                  </View>
                </View>
              </>
            )}

            {mode === "forgot" && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput style={styles.input} placeholder="you@email.com" placeholderTextColor="#4a5568" value={form.email} onChangeText={set("email")} keyboardType="email-address" autoCapitalize="none" />
              </View>
            )}

            {mode === "reset" && (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Reset Token</Text>
                  <TextInput style={styles.input} placeholder="Paste token from email" placeholderTextColor="#4a5568" value={form.resetToken} onChangeText={set("resetToken")} autoCapitalize="none" />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>New Password</Text>
                  <TextInput style={styles.input} placeholder="New password" placeholderTextColor="#4a5568" value={form.newPassword} onChangeText={set("newPassword")} secureTextEntry />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <TextInput style={styles.input} placeholder="Confirm password" placeholderTextColor="#4a5568" value={form.confirmPassword} onChangeText={set("confirmPassword")} secureTextEntry />
                </View>
              </>
            )}

            {mode === "login" && (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Username</Text>
                  <TextInput style={styles.input} placeholder="your_username" placeholderTextColor="#4a5568" value={form.username} onChangeText={set("username")} autoCapitalize="none" />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.passwordRow}>
                    <TextInput style={[styles.input, { flex: 1 }]} placeholder="••••••••" placeholderTextColor="#4a5568" value={form.password} onChangeText={set("password")} secureTextEntry={!showPassword} />
                    <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                      <Text style={{ color: "#6b7a99" }}>{showPassword ? "🙈" : "👁️"}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {otpMode && (
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>OTP Code</Text>
                    <TextInput style={styles.input} placeholder="Enter 6-digit OTP" placeholderTextColor="#4a5568" value={otp} onChangeText={(v) => setOtp(v.replace(/\D/g, "").slice(0, 6))} keyboardType="number-pad" maxLength={6} />
                    <Text style={styles.hint}>We sent the code to your email.</Text>
                  </View>
                )}
              </>
            )}

            <TouchableOpacity style={styles.btnPrimary} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#0a0e1a" /> : <Text style={styles.btnPrimaryText}>{btnLabel()}</Text>}
            </TouchableOpacity>

            {mode === "login" && otpMode && (
              <View style={styles.row}>
                <TouchableOpacity style={[styles.btnGhost, { flex: 1 }]} onPress={async () => {
                  try { setLoading(true); const r = await resendOtp(form.username, form.password); setSuccess(r.message || "OTP resent."); } catch (e) { setError(getErrorMessage(e, "Could not resend.")); } finally { setLoading(false); }
                }}>
                  <Text style={styles.btnGhostText}>Resend OTP</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btnGhost, { flex: 1 }]} onPress={() => { setOtpMode(false); setOtp(""); }}>
                  <Text style={styles.btnGhostText}>Back</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.modeRow}>
              {mode !== "login" && <TouchableOpacity onPress={() => openMode("login")}><Text style={styles.link}>Back to sign in</Text></TouchableOpacity>}
              {mode !== "register" && <TouchableOpacity onPress={() => openMode("register")}><Text style={styles.link}>Create account</Text></TouchableOpacity>}
              {mode === "login" && <TouchableOpacity onPress={() => openMode("forgot")}><Text style={styles.link}>Forgot password</Text></TouchableOpacity>}
              {mode === "forgot" && <TouchableOpacity onPress={() => openMode("reset")}><Text style={styles.link}>I have a reset token</Text></TouchableOpacity>}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0e1a" },
  container: { padding: 20, paddingBottom: 40 },
  header: { alignItems: "center", marginBottom: 28, marginTop: 16 },
  logo: { width: 64, height: 64, borderRadius: 18, marginBottom: 12 },
  appName: { fontSize: 26, fontWeight: "800", color: "#fff", marginBottom: 6 },
  subtitle: { fontSize: 13, color: "#6b7a99", textAlign: "center" },
  alertError: { backgroundColor: "rgba(252,129,129,0.12)", borderRadius: 8, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: "rgba(252,129,129,0.3)" },
  alertSuccess: { backgroundColor: "rgba(0,229,160,0.1)", borderRadius: 8, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: "rgba(0,229,160,0.3)" },
  alertText: { color: "#fff", fontSize: 13 },
  card: { backgroundColor: "#111827", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#1e2535" },
  row: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  formGroup: { marginBottom: 14 },
  selectField: { flex: 1 },
  label: { fontSize: 12, color: "#6b7a99", marginBottom: 6, fontWeight: "600", textTransform: "uppercase" },
  input: { backgroundColor: "#0d1526", borderWidth: 1, borderColor: "#1e2535", borderRadius: 8, padding: 12, color: "#fff", fontSize: 14 },
  passwordRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  passwordInput: { flex: 1 },
  eyeBtn: { padding: 12, backgroundColor: "#0d1526", borderRadius: 8, borderWidth: 1, borderColor: "#1e2535" },
  eyeIcon: { color: "#6b7a99", fontSize: 18 },
  hint: { fontSize: 11, color: "#6b7a99", marginTop: 6 },
  pickerButton: {
    backgroundColor: "#0d1526",
    borderWidth: 1,
    borderColor: "#1e2535",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickerText: { color: "#fff", fontSize: 14, flex: 1 },
  pickerArrow: { color: "#6b7a99", fontSize: 16, marginLeft: 8 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(3, 8, 20, 0.82)",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    maxHeight: "80%",
    backgroundColor: "#111827",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1e2535",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1e2535",
  },
  modalTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  closeText: { color: "#00e5a0", fontSize: 13, fontWeight: "600" },
  searchInput: {
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: "#0d1526",
    borderWidth: 1,
    borderColor: "#1e2535",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#fff",
  },
  optionList: { maxHeight: 320 },
  optionListContent: { paddingBottom: 8 },
  optionItem: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#1e2535" },
  optionItemSelected: { backgroundColor: "rgba(0,229,160,0.12)" },
  optionText: { color: "#fff", fontSize: 14 },
  optionTextSelected: { color: "#00e5a0", fontWeight: "600" },
  emptyState: { padding: 20, alignItems: "center" },
  emptyText: { color: "#6b7a99", fontSize: 13 },
  btnPrimary: { backgroundColor: "#00e5a0", borderRadius: 10, padding: 14, alignItems: "center", marginTop: 8 },
  btnPrimaryText: { fontSize: 15, fontWeight: "700", color: "#0a0e1a" },
  btnGhost: { borderRadius: 10, padding: 12, alignItems: "center", borderWidth: 1, borderColor: "#1e2535", marginTop: 10 },
  btnGhostText: { fontSize: 13, color: "#6b7a99", fontWeight: "600" },
  modeRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12, marginTop: 16 },
  link: { fontSize: 13, color: "#00e5a0", fontWeight: "600" },
});
