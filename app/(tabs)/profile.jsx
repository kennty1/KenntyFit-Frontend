import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, TextInput, Alert, Image, RefreshControl,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import API, { API_BASE_URL } from "../../api/axios";
import { COUNTRIES } from "../../utils/countries";

const GOALS = ["WEIGHT LOSS", "MUSCLE GAIN", "MAINTAIN WEIGHT", "IMPROVE FITNESS"];
const ACTS = ["SEDENTARY", "LIGHTLY ACTIVE", "MODERATELY ACTIVE", "VERY ACTIVE", "EXTRA ACTIVE"];
const GENDERS = ["MALE", "FEMALE", "OTHER"];
const HEALTH_STATUSES = ["None", "Diabetes", "Hypertension", "High Cholesterol", "Vegetarian"];

function SelectField({ label, value, options, onChange, theme }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.formGroup}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <TouchableOpacity style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]} onPress={() => setOpen((o) => !o)}>
        <Text style={{ color: theme.text }}>{value || "Select country"}</Text>
      </TouchableOpacity>
      {open && (
        <View style={[styles.dropdown, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}> 
          <ScrollView style={{ maxHeight: 240 }}>
            {options.map((o) => (
              <TouchableOpacity key={o} style={styles.dropdownItem} onPress={() => { onChange(o); setOpen(false); }}>
                <Text style={{ color: value === o ? theme.accent : theme.text }}>{o}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const getProfilePictureUri = (value) => {
  const raw = typeof value === "string"
    ? value.trim()
    : (
      value?.profilePictureUrl ||
      value?.profilePicture ||
      value?.avatarUrl ||
      value?.imageUrl ||
      ""
    );

  if (!raw) {
    return "";
  }

  if (/^https?:\/\//i.test(raw) || raw.startsWith("file://") || raw.startsWith("content://") || raw.startsWith("data:")) {
    return raw;
  }

  const origin = String(API_BASE_URL || "").replace(/\/api\/?$/, "");
  if (raw.startsWith("/")) {
    return `${origin}${raw}`;
  }

  return `${origin}/${raw}`;
};

const mergeProfilePicture = (profile, pictureValue) => {
  const profilePictureUrl = getProfilePictureUri(pictureValue);
  return {
    ...profile,
    profilePictureUrl,
    profilePicture: profilePictureUrl,
  };
};

export default function Profile() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, logout, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [sub, setSub] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tab, setTab] = useState("profile");

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      const [pRes, sRes] = await Promise.allSettled([
        API.get(`/users/${user.id}`),
        API.get(`/subscriptions/user/${user.id}`),
      ]);
      if (pRes.status === "fulfilled") {
        const nextProfile = mergeProfilePicture(pRes.value.data, pRes.value.data);
        setProfile(nextProfile);
        setForm(nextProfile);
      } else {
        const fallbackProfile = mergeProfilePicture(user, user);
        setProfile(fallbackProfile);
        setForm(fallbackProfile);
      }
      if (sRes.status === "fulfilled") setSub(sRes.value.data);
    } catch {
      const fallbackProfile = mergeProfilePicture(user, user);
      setProfile(fallbackProfile);
      setForm(fallbackProfile);
    }
    finally { setLoading(false); setRefreshing(false); }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true); setError(""); setSuccess("");
    try {
      const res = await API.put(`/users/${user.id}`, {
        ...form,
        age: +form.age, weight: +form.weight, height: +form.height,
        dailyCalorieTarget: +form.dailyCalorieTarget,
        dailyWaterTarget: +form.dailyWaterTarget,
        country: form.country,
        healthStatus: form.healthStatus,
      });
      const nextProfile = mergeProfilePicture(res.data, res.data);
      setProfile(nextProfile);
      await updateUser(nextProfile);
      setSuccess("Profile updated successfully!");
      setEditing(false);
    } catch (e) {
      setError(e.response?.data?.message || "Could not save profile.");
    } finally { setSaving(false); }
  };

  const handleCancelSubscription = () => {
    if (!sub || !user?.id) return;
    Alert.alert(
      "Cancel Subscription",
      "Are you sure you want to cancel your current subscription? You will keep access until the end of the current billing period.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, cancel",
          style: "destructive",
          onPress: async () => {
            setCanceling(true);
            setError("");
            setSuccess("");
            try {
              const endpoint = sub?.id ? `/subscriptions/${sub.id}/cancel` : `/subscriptions/user/${user.id}/cancel`;
              const response = await API.post(endpoint, { userId: user.id });
              const nextSub = response.data || { ...sub, active: false };
              setSub(nextSub);
              setSuccess("Subscription cancelled successfully.");
            } catch (e) {
              if (e.response?.status === 404) {
                try {
                  const response = await API.delete(`/subscriptions/user/${user.id}`);
                  const nextSub = response.data || { ...sub, active: false };
                  setSub(nextSub);
                  setSuccess("Subscription cancelled successfully.");
                } catch (innerError) {
                  setError(innerError.response?.data?.message || "Could not cancel subscription.");
                }
              } else {
                setError(e.response?.data?.message || "Could not cancel subscription.");
              }
            } finally {
              setCanceling(false);
            }
          },
        },
      ],
    );
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission needed", "Allow photo access to change profile picture."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8, base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      try {
        const formData = new FormData();
        formData.append("file", { uri: asset.uri, type: "image/jpeg", name: "profile.jpg" });
        const res = await API.post(`/users/${user.id}/profile-picture`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const uploadedPicture = getProfilePictureUri(res.data) || asset.uri;
        setProfile((p) => mergeProfilePicture(p, uploadedPicture));
        await updateUser(mergeProfilePicture(user, uploadedPicture));
        setSuccess("Profile picture updated!");
      } catch { Alert.alert("Error", "Could not upload profile picture."); }
    }
  };

  if (loading) return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }] }>
      <View style={styles.center}><ActivityIndicator size="large" color={theme.accent} /></View>
    </SafeAreaView>
  );

  const avatarLetter = (profile?.firstName || profile?.username || "U")[0]?.toUpperCase();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }] }>
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={theme.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Back button when opened from Settings */}
        <TouchableOpacity style={styles.backBtn} onPress={() => { if (router.canGoBack()) router.back(); else router.replace("/(tabs)/settings"); }}>
          <MaterialCommunityIcons name="chevron-left" size={22} color={theme.accent} />
          <Text style={[styles.backText, { color: theme.accent }]}>{"Back"}</Text>
        </TouchableOpacity>
        {/* Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarWrap}>
            {getProfilePictureUri(profile) ? (
              <Image source={{ uri: getProfilePictureUri(profile) }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}><Text style={styles.avatarLetter}>{avatarLetter}</Text></View>
            )}
            <View style={styles.avatarBadge}><Text style={{ fontSize: 12 }}>📷</Text></View>
          </TouchableOpacity>
          <Text style={[styles.profileName, { color: theme.text }]}>{profile?.firstName} {profile?.lastName}</Text>
          <Text style={[styles.profileUsername, { color: theme.muted }]}>@{profile?.username}</Text>
          {sub?.active && (
            <View style={[styles.subBadge, { borderColor: theme.accent, backgroundColor: "rgba(0,229,160,0.08)" }]}> 
              <Text style={[styles.subBadgeText, { color: theme.accent } ]}>✓ {sub.plan} · {sub.daysRemaining}d left</Text>
            </View>
          )}
        </View>

        {error ? <View style={[styles.alertError, { backgroundColor: theme.danger === "#ff6b6b" ? "rgba(252,129,129,0.1)" : "rgba(252,129,129,0.1)" }]}><Text style={[styles.alertText, { color: theme.text }]}>⚠️ {error}</Text></View> : null}
        {success ? <View style={[styles.alertSuccess, { backgroundColor: theme.success === "#22c55e" ? "rgba(0,229,160,0.1)" : "rgba(0,229,160,0.1)" }]}><Text style={[styles.alertText, { color: theme.text }]}>✅ {success}</Text></View> : null}

        {/* Tabs */}
        <View style={styles.tabRow}>
          {["profile", "subscription"].map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.tabBtn,
                { borderColor: theme.border, backgroundColor: tab === t ? theme.accent : theme.surface },
              ]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, { color: tab === t ? theme.accentText : theme.text }]}>
                {t === "profile" ? "Profile" : "Subscription"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === "profile" && (
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
            {!editing ? (
              <>
                {[
                  ["Name", `${profile?.firstName || ""} ${profile?.lastName || ""}`],
                  ["Email", profile?.email],
                  ["Age", profile?.age],
                  ["Gender", profile?.gender],
                  ["Weight", profile?.weight ? `${profile.weight} kg` : "—"],
                  ["Height", profile?.height ? `${profile.height} m` : "—"],
                  ["Goal", profile?.fitnessGoal?.replace(/_/g, " ")],
                  ["Activity", profile?.activityLevel?.replace(/_/g, " ")],
                  ["Health Status", profile?.healthStatus || "—"],
                  ["Country", profile?.country || "—"],
                  ["Calorie Target", `${profile?.dailyCalorieTarget} kcal`],
                  ["Water Target", `${profile?.dailyWaterTarget} ml`],
                ].map(([k, v]) => (
                  <View key={k} style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: theme.muted }]}>{k}</Text>
                    <Text style={[styles.infoValue, { color: theme.text }]}>{v || "—"}</Text>
                  </View>
                ))}
                <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: theme.accent }]} onPress={() => setEditing(true)}>
                  <Text style={[styles.btnPrimaryText, { color: theme.accentText }]}>Edit Profile</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {[
                  { label: "First Name", key: "firstName" },
                  { label: "Last Name", key: "lastName" },
                  { label: "Age", key: "age", numeric: true },
                  { label: "Weight (kg)", key: "weight", numeric: true },
                  { label: "Height (m)", key: "height", decimal: true },
                  { label: "Daily Calorie Target", key: "dailyCalorieTarget", numeric: true },
                  { label: "Daily Water Target (ml)", key: "dailyWaterTarget", numeric: true },
                ].map(({ label, key, numeric, decimal }) => (
                  <View key={key} style={styles.formGroup}>
                      <Text style={[styles.label, { color: theme.muted }]}>{label}</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                        value={String(form[key] || "")}
                        onChangeText={set(key)}
                        keyboardType={numeric ? "numeric" : decimal ? "decimal-pad" : "default"}
                        placeholderTextColor={theme.placeholder}
                      />
                  </View>
                ))}

                {/* Goal select */}
                <Text style={styles.label}>Fitness Goal</Text>
                {GOALS.map((g) => (
                  <TouchableOpacity key={g} style={[styles.optionBtnFull, form.fitnessGoal === g && styles.optionBtnActive, { borderColor: theme.inputBorder }]} onPress={() => set("fitnessGoal")(g)}>
                    <Text style={{ color: form.fitnessGoal === g ? theme.accentText : theme.muted, fontSize: 12, fontWeight: "600" }}>{g.replace(/_/g, " ")}</Text>
                  </TouchableOpacity>
                ))}

                <SelectField label="Country" value={form.country} options={COUNTRIES} onChange={set("country")} theme={theme} />

                <Text style={[styles.label, { color: theme.muted }]}>Health Status</Text>
                <View style={styles.optionRow}>
                  {HEALTH_STATUSES.map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[styles.optionBtn, form.healthStatus === status && styles.optionBtnActive, { borderColor: theme.inputBorder }]}
                      onPress={() => set("healthStatus")(status)}
                    >
                      <Text style={{ color: form.healthStatus === status ? theme.accentText : theme.muted, fontSize: 12, fontWeight: "600" }}>{status}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.editBtns}>
                  <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: theme.accent }]} onPress={handleSave} disabled={saving}>
                    {saving ? <ActivityIndicator color={theme.accentText} /> : <Text style={[styles.btnPrimaryText, { color: theme.accentText }]}>Save Changes</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btnGhost, { borderColor: theme.border }]} onPress={() => { setEditing(false); setForm(profile); }}>
                    <Text style={[styles.btnGhostText, { color: theme.muted }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}

        {tab === "subscription" && (
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {sub?.active ? (
              <>
                {[
                  ["Plan", sub.plan],
                  ["Status", "Active ✓"],
                  ["Expires", sub.endDate],
                  ["Days Left", `${sub.daysRemaining} days`],
                ].map(([k, v]) => (
                  <View key={k} style={[styles.infoRow, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.infoLabel, { color: theme.muted }]}>{k}</Text>
                    <Text style={[styles.infoValue, k === "Status" ? { color: theme.success } : { color: theme.text }]}>{v}</Text>
                  </View>
                ))}
                <TouchableOpacity style={styles.btnCancel} onPress={handleCancelSubscription} disabled={canceling}>
                  {canceling ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnCancelText}>Cancel Subscription</Text>}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.noSubBox}>
                  <Text style={styles.noSubEmoji}>💎</Text>
                  <Text style={[styles.noSubTitle, { color: theme.text }]}>No Active Subscription</Text>
                  <Text style={[styles.noSubText, { color: theme.muted }]}>Subscribe to unlock all features.</Text>
                </View>
                <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: theme.accent }]} onPress={() => router.push("/pricing") }>
                  <Text style={[styles.btnPrimaryText, { color: theme.accentText }]}>View Plans</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Sign Out */}
        <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => Alert.alert("Sign Out", "Are you sure?", [
          { text: "Cancel", style: "cancel" },
          { text: "Sign Out", style: "destructive", onPress: logout },
        ])}>
          <Text style={[styles.logoutText, { color: theme.danger }]}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0e1a" },
  container: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  profileHeader: { alignItems: "center", marginBottom: 24 },
  avatarWrap: { position: "relative", marginBottom: 12 },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarFallback: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#00e5a0", alignItems: "center", justifyContent: "center" },
  avatarLetter: { fontSize: 32, fontWeight: "900", color: "#0a0e1a" },
  avatarBadge: { position: "absolute", bottom: 0, right: 0, backgroundColor: "#111827", borderRadius: 12, padding: 4, borderWidth: 2, borderColor: "#0a0e1a" },
  profileName: { fontSize: 20, fontWeight: "800", color: "#fff", marginBottom: 2 },
  profileUsername: { fontSize: 13, color: "#6b7a99", marginBottom: 8 },
  subBadge: { backgroundColor: "rgba(0,229,160,0.1)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: "rgba(0,229,160,0.3)" },
  subBadgeText: { fontSize: 12, color: "#00e5a0", fontWeight: "600" },
  alertError: { backgroundColor: "rgba(252,129,129,0.1)", borderRadius: 8, padding: 12, marginBottom: 14 },
  alertSuccess: { backgroundColor: "rgba(0,229,160,0.1)", borderRadius: 8, padding: 12, marginBottom: 14 },
  alertText: { color: "#fff", fontSize: 13 },
  tabRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  tabBtn: { flex: 1, padding: 10, borderRadius: 8, alignItems: "center", borderWidth: 1, borderColor: "#1e2535" },
  tabBtnActive: { backgroundColor: "#00e5a0", borderColor: "#00e5a0" },
  tabText: { fontSize: 13, fontWeight: "600", color: "#6b7a99" },
  tabTextActive: { color: "#0a0e1a" },
  card: { backgroundColor: "#111827", borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#1e2535" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#1e2535" },
  infoLabel: { fontSize: 13, color: "#6b7a99" },
  infoValue: { fontSize: 13, fontWeight: "600", color: "#fff" },
  formGroup: { marginBottom: 14 },
  label: { fontSize: 11, color: "#6b7a99", fontWeight: "600", textTransform: "uppercase", marginBottom: 6, marginTop: 4 },
  input: { backgroundColor: "#0d1526", borderWidth: 1, borderColor: "#1e2535", borderRadius: 8, padding: 12, color: "#fff", fontSize: 14 },
  optionRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  optionBtn: { flex: 1, padding: 10, borderRadius: 8, alignItems: "center", borderWidth: 1, borderColor: "#1e2535" },
  optionBtnFull: { padding: 10, borderRadius: 8, alignItems: "center", borderWidth: 1, borderColor: "#1e2535", marginBottom: 6 },
  optionBtnActive: { backgroundColor: "#00e5a0", borderColor: "#00e5a0" },
  dropdown: { backgroundColor: "#0d1526", borderRadius: 8, borderWidth: 1, borderColor: "#1e2535", marginTop: 4 },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#1e2535" },
  editBtns: { gap: 10, marginTop: 16 },
  btnPrimary: { backgroundColor: "#00e5a0", borderRadius: 10, padding: 14, alignItems: "center", marginTop: 16 },
  btnPrimaryText: { fontSize: 15, fontWeight: "700", color: "#0a0e1a" },
  btnGhost: { borderRadius: 10, padding: 12, alignItems: "center", borderWidth: 1, borderColor: "#1e2535" },
  btnGhostText: { fontSize: 14, color: "#6b7a99", fontWeight: "600" },
  btnCancel: { marginTop: 14, backgroundColor: "#ff6b6b", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  btnCancelText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  noSubBox: { alignItems: "center", padding: 24 },
  noSubEmoji: { fontSize: 40, marginBottom: 12 },
  noSubTitle: { fontSize: 16, fontWeight: "700", color: "#fff", marginBottom: 6 },
  noSubText: { fontSize: 13, color: "#6b7a99" },
  logoutBtn: { backgroundColor: "rgba(255,107,107,0.1)", borderRadius: 10, padding: 14, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,107,107,0.3)", marginTop: 8 },
  logoutText: { fontSize: 14, fontWeight: "700", color: "#ff6b6b" },
  backBtn: { flexDirection: "row", alignItems: "center", marginBottom: 16, paddingVertical: 8 },
  backText: { fontSize: 16, fontWeight: "600", marginLeft: 6 },
});
