import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
} from "react-native";

export default function PasswordInput({
  value,
  onChange,
  placeholder = "••••••••",
  label = "Password",
  required = false,
}) {
  const [show, setShow] = useState(false);

  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#4a5568"
          secureTextEntry={!show}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.eyeBtn} onPress={() => setShow(!show)}>
          <Text style={styles.eyeText}>{show ? "🙈" : "👁️"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { marginBottom: 16 },
  label: { fontSize: 11, color: "#6b7a99", fontWeight: "600", textTransform: "uppercase", marginBottom: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  input: {
    flex: 1, backgroundColor: "#0d1526", borderWidth: 1, borderColor: "#1e2535",
    borderRadius: 8, padding: 12, color: "#fff", fontSize: 14,
  },
  eyeBtn: {
    backgroundColor: "#0d1526", borderWidth: 1, borderColor: "#1e2535",
    borderRadius: 8, padding: 12,
  },
  eyeText: { fontSize: 16 },
});
