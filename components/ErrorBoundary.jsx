import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.safe}>
          <View style={styles.container}>
            <Text style={styles.emoji}>⚠️</Text>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              {this.state.error?.message || "An unexpected error occurred"}
            </Text>
            <TouchableOpacity
              style={styles.btn}
              onPress={() => this.setState({ hasError: false, error: null })}
            >
              <Text style={styles.btnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0e1a" },
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emoji: { fontSize: 52, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: "700", color: "#fff", marginBottom: 12, textAlign: "center" },
  message: { fontSize: 14, color: "#6b7a99", marginBottom: 28, textAlign: "center", lineHeight: 20 },
  btn: { backgroundColor: "#00e5a0", borderRadius: 10, paddingHorizontal: 28, paddingVertical: 13 },
  btnText: { fontSize: 15, fontWeight: "700", color: "#0a0e1a" },
});
