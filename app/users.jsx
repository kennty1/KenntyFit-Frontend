import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, TextInput, Alert, Modal,
} from "react-native";
import API from "../api/axios";

const EMPTY = {
  username: "", email: "", firstName: "", lastName: "", age: "",
  weight: "", height: "", gender: "MALE", fitnessGoal: "WEIGHT_LOSS",
  activityLevel: "MODERATELY_ACTIVE", dailyCalorieTarget: "", dailyWaterTarget: "", role: "USER",
};
const GENDERS = ["MALE", "FEMALE", "OTHER"];
const GOALS = ["WEIGHT_LOSS", "MUSCLE_GAIN", "MAINTAIN_WEIGHT", "IMPROVE_FITNESS"];
const ACTS = ["SEDENTARY", "LIGHTLY_ACTIVE", "MODERATELY_ACTIVE", "VERY_ACTIVE", "EXTRA_ACTIVE"];

function SelectRow({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.formGroup}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.input} onPress={() => setOpen(!open)}>
        <Text style={{ color: "#fff", fontSize: 14 }}>{value}</Text>
      </TouchableOpacity>
      {open && (
        <View style={styles.dropdown}>
          {options.map((o) => (
            <TouchableOpacity key={o} style={styles.dropdownItem} onPress={() => { onChange(o); setOpen(false); }}>
              <Text style={{ color: value === o ? "#00e5a0" : "#fff", fontSize: 13 }}>{o.replace(/_/g, " ")}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const load = async () => {
    try {
      const r = await API.get("/users");
      setUsers(r.data || []);
    } catch { Alert.alert("Error", "Could not load users."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const openAdd = () => { setEditing(null); setForm(EMPTY); setError(""); setShowModal(true); };
  const openEdit = (u) => { setEditing(u.id); setForm({ ...u }); setError(""); setShowModal(true); };

  const handleSubmit = async () => {
    setError(""); setSaving(true);
    try {
      const p = {
        ...form,
        age: +form.age, weight: +form.weight, height: +form.height,
        dailyCalorieTarget: +form.dailyCalorieTarget,
        dailyWaterTarget: +form.dailyWaterTarget,
      };
      if (editing) await API.put(`/users/${editing}`, p);
      else await API.post("/users", p);
      setShowModal(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save.");
    } finally { setSaving(false); }
  };

  const deleteUser = (id) => {
    Alert.alert("Delete User", "Are you sure you want to delete this user?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try { await API.delete(`/users/${id}`); await load(); }
        catch { Alert.alert("Error", "Could not delete user."); }
      }},
    ]);
  };

  const filtered = users.filter(
    (u) =>
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}><ActivityIndicator size="large" color="#00e5a0" /></View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Users 👥</Text>
            <Text style={styles.sub}>{users.length} total users · Admin only</Text>
          </View>
          <TouchableOpacity style={styles.btnPrimary} onPress={openAdd}>
            <Text style={styles.btnPrimaryText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <TextInput
          style={styles.searchInput}
          placeholder="Search by username or email..."
          placeholderTextColor="#4a5568"
          value={search}
          onChangeText={setSearch}
        />

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: "Total", value: users.length, icon: "👥", color: "#00e5a0" },
            { label: "Admins", value: users.filter((u) => u.role?.includes("ADMIN")).length, icon: "🔑", color: "#ff6b6b" },
            { label: "Members", value: users.filter((u) => !u.role?.includes("ADMIN")).length, icon: "🙋", color: "#0099ff" },
          ].map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* User list */}
        {filtered.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No users found.</Text>
          </View>
        ) : (
          filtered.map((u) => (
            <View key={u.id} style={styles.userCard}>
              <View style={styles.userHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{u.username?.[0]?.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>{u.username}</Text>
                  <Text style={styles.userSub}>{u.firstName} {u.lastName}</Text>
                </View>
                <View style={[styles.roleBadge, { backgroundColor: u.role?.includes("ADMIN") ? "rgba(255,107,107,0.15)" : "rgba(0,229,160,0.15)" }]}>
                  <Text style={[styles.roleText, { color: u.role?.includes("ADMIN") ? "#ff6b6b" : "#00e5a0" }]}>
                    {u.role?.replace("ROLE_", "")}
                  </Text>
                </View>
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userDetail}>📧 {u.email}</Text>
                <Text style={styles.userDetail}>🎯 {u.fitnessGoal?.replace(/_/g, " ")}</Text>
                <Text style={styles.userDetail}>🎂 Age: {u.age} · ⚖️ {u.weight}kg</Text>
                {u.createdAt && <Text style={styles.userDetail}>📅 Joined: {u.createdAt?.split("T")[0]}</Text>}
              </View>
              <View style={styles.userActions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(u)}>
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteUser(u.id)}>
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{editing ? "Edit User" : "Add New User"}</Text>
            {error ? <View style={styles.alertError}><Text style={styles.alertText}>{error}</Text></View> : null}
            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { label: "Username *", key: "username" },
                { label: "Email", key: "email", keyboardType: "email-address" },
                { label: "First Name", key: "firstName" },
                { label: "Last Name", key: "lastName" },
                { label: "Age", key: "age", numeric: true },
                { label: "Weight (kg)", key: "weight", decimal: true },
                { label: "Height (m)", key: "height", decimal: true },
                { label: "Calorie Target", key: "dailyCalorieTarget", numeric: true },
                { label: "Water Target (ml)", key: "dailyWaterTarget", numeric: true },
              ].map(({ label, key, numeric, decimal, keyboardType }) => (
                <View key={key} style={styles.formGroup}>
                  <Text style={styles.label}>{label}</Text>
                  <TextInput
                    style={styles.input}
                    value={String(form[key] || "")}
                    onChangeText={set(key)}
                    keyboardType={numeric ? "numeric" : decimal ? "decimal-pad" : keyboardType || "default"}
                    autoCapitalize="none"
                    placeholderTextColor="#4a5568"
                  />
                </View>
              ))}

              <SelectRow label="Gender" value={form.gender} options={GENDERS} onChange={set("gender")} />
              <SelectRow label="Fitness Goal" value={form.fitnessGoal} options={GOALS} onChange={set("fitnessGoal")} />
              <SelectRow label="Activity Level" value={form.activityLevel} options={ACTS} onChange={set("activityLevel")} />

              {/* Role */}
              <Text style={styles.label}>Role</Text>
              <View style={styles.optionRow}>
                {["USER", "ADMIN"].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.optionBtn, form.role === r && styles.optionBtnActive]}
                    onPress={() => set("role")(r)}
                  >
                    <Text style={{ color: form.role === r ? "#0a0e1a" : "#6b7a99", fontWeight: "700", fontSize: 13 }}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalBtns}>
                <TouchableOpacity style={styles.btnPrimary} onPress={handleSubmit} disabled={saving}>
                  {saving ? <ActivityIndicator color="#0a0e1a" /> : (
                    <Text style={styles.btnPrimaryText}>{editing ? "Save Changes" : "Create User"}</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnGhost} onPress={() => setShowModal(false)}>
                  <Text style={styles.btnGhostText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0e1a" },
  container: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 24, fontWeight: "800", color: "#fff" },
  sub: { fontSize: 13, color: "#6b7a99" },
  btnPrimary: { backgroundColor: "#00e5a0", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  btnPrimaryText: { fontSize: 14, fontWeight: "700", color: "#0a0e1a" },
  btnGhost: { borderRadius: 10, padding: 12, alignItems: "center", borderWidth: 1, borderColor: "#1e2535", marginTop: 10 },
  btnGhostText: { fontSize: 14, color: "#6b7a99", fontWeight: "600" },
  searchInput: { backgroundColor: "#111827", borderWidth: 1, borderColor: "#1e2535", borderRadius: 10, padding: 12, color: "#fff", fontSize: 14, marginBottom: 16 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: "#111827", borderRadius: 10, padding: 12, alignItems: "center", borderWidth: 1, borderColor: "#1e2535" },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 10, color: "#6b7a99", textTransform: "uppercase" },
  emptyCard: { backgroundColor: "#111827", borderRadius: 12, padding: 32, alignItems: "center", borderWidth: 1, borderColor: "#1e2535" },
  emptyText: { color: "#6b7a99", fontSize: 14 },
  userCard: { backgroundColor: "#111827", borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: "#1e2535" },
  userHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#00e5a0", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 16, fontWeight: "800", color: "#0a0e1a" },
  userName: { fontSize: 14, fontWeight: "700", color: "#fff" },
  userSub: { fontSize: 11, color: "#6b7a99" },
  roleBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  roleText: { fontSize: 10, fontWeight: "700" },
  userDetails: { gap: 4, marginBottom: 12 },
  userDetail: { fontSize: 12, color: "#6b7a99" },
  userActions: { flexDirection: "row", gap: 8 },
  editBtn: { flex: 1, backgroundColor: "#1e2535", borderRadius: 8, padding: 8, alignItems: "center" },
  editBtnText: { fontSize: 12, fontWeight: "600", color: "#fff" },
  deleteBtn: { flex: 1, backgroundColor: "rgba(255,107,107,0.1)", borderRadius: 8, padding: 8, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,107,107,0.3)" },
  deleteBtnText: { fontSize: 12, fontWeight: "600", color: "#ff6b6b" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
  modal: { backgroundColor: "#111827", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: "90%" },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#fff", marginBottom: 16 },
  alertError: { backgroundColor: "rgba(255,107,107,0.1)", borderRadius: 8, padding: 10, marginBottom: 12 },
  alertText: { color: "#ff6b6b", fontSize: 13 },
  formGroup: { marginBottom: 12 },
  label: { fontSize: 11, color: "#6b7a99", fontWeight: "600", textTransform: "uppercase", marginBottom: 5 },
  input: { backgroundColor: "#0d1526", borderWidth: 1, borderColor: "#1e2535", borderRadius: 8, padding: 12, color: "#fff", fontSize: 14 },
  dropdown: { backgroundColor: "#0d1526", borderRadius: 8, borderWidth: 1, borderColor: "#1e2535", marginTop: 4 },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#1e2535" },
  optionRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  optionBtn: { flex: 1, padding: 10, borderRadius: 8, alignItems: "center", borderWidth: 1, borderColor: "#1e2535" },
  optionBtnActive: { backgroundColor: "#00e5a0", borderColor: "#00e5a0" },
  modalBtns: { gap: 10, marginTop: 16, marginBottom: 20 },
});
