import React, { useEffect, useState } from "react";
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  Animated, Alert,
} from "react-native";
import { hydrationEmitter, HYDRATION_EVENTS } from "../services/hydrationAutoTracker";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";

export default function WaterDetectionPrompt() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detectionData, setDetectionData] = useState(null);
  const [slideAnim] = useState(new Animated.Value(0));

  // Calculate estimated amount: 25ml per sip detected
  const estimateWaterAmount = (sipCount) => {
    return Math.max(100, (sipCount || 2) * 25); // minimum 100ml
  };

  useEffect(() => {
    const handleDetection = (data) => {
      setDetectionData(data);
      setVisible(true);

      // Auto-animate in
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    };

    hydrationEmitter.on(HYDRATION_EVENTS.DETECTED, handleDetection);

    return () => {
      hydrationEmitter.off(HYDRATION_EVENTS.DETECTED, handleDetection);
    };
  }, [slideAnim]);

  const handleConfirm = async () => {
    if (!user?.id || !detectionData) return;

    setLoading(true);
    const estimatedAmount = estimateWaterAmount(detectionData.sipCount);

    try {
      await API.post(`/water-intake/user/${user.id}/auto-track`, {
        amountMl: estimatedAmount,
        sourceDevice: detectionData.sourceDevice,
        sensorType: detectionData.sensorType,
        beverageType: "WATER",
        sourceReference: "HIGH_CONFIDENCE_MOTION_DETECTION",
        deviceWithUser: true,
        confidenceScore: detectionData.confidenceScore,
        sipCount: detectionData.sipCount || 2,
        detectedAt: detectionData.detectedAt,
        notes: `Auto-logged: ${estimatedAmount}ml from ${detectionData.sipCount || 2} drinking motions (${(detectionData.confidenceScore * 100).toFixed(0)}% confident)`,
      });

      console.log("[Hydration] ✓ Water intake logged successfully", {
        amount: estimatedAmount,
        confidence: detectionData.confidenceScore,
      });

      // Emit confirmed event
      hydrationEmitter.emit(HYDRATION_EVENTS.CONFIRMED, detectionData);

      // Dismiss with animation
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setVisible(false);
        setDetectionData(null);
      });
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || "Unknown error";
      const status = error.response?.status || "No response";
      const code = error.code;
      
      let troubleshootMsg = `Failed to log water: ${errorMsg}`;
      
      if (error.code === "ECONNREFUSED" || code === "ERR_NETWORK") {
        troubleshootMsg = `Cannot connect to backend.\n\nMake sure:\n1. Backend is running on http://localhost:8081\n2. Port 8081 is accessible\n3. Firewall allows localhost access`;
      } else if (error.code === "ENOTFOUND") {
        troubleshootMsg = `DNS/Network error. Check backend URL and network connection.`;
      } else if (status === 404) {
        troubleshootMsg = `Endpoint not found (404). Backend may have different endpoint structure.`;
      } else if (error.code === "ETIMEDOUT" || error.message.includes("timeout")) {
        troubleshootMsg = `Request timed out. Backend may be overloaded.\n\nTry restarting the backend.`;
      }
      
      console.error("Water intake logging failed:", {
        status,
        code,
        message: errorMsg,
        url: error.config?.url,
      });
      
      Alert.alert(
        "Connection Error",
        troubleshootMsg,
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Auto-confirm if confidence is very high (85%+) - no user interaction needed
  useEffect(() => {
    if (visible && detectionData && detectionData.confidenceScore >= 0.85) {
      console.log("[Hydration] High confidence (85%+), auto-logging...");
      
      // Auto-confirm after brief animation (500ms)
      const timer = setTimeout(() => {
        handleConfirm();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [visible, detectionData]);

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      setDetectionData(null);
    });
  };

  const isHighConfidence = detectionData?.confidenceScore >= 0.85;
  const confidencePercent = Math.round((detectionData?.confidenceScore || 0) * 100);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            { transform: [{ translateY }] },
            isHighConfidence && { backgroundColor: "#0d1b14", borderColor: "#00e5a044" },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>
              {isHighConfidence ? "✓ " : ""}💧 Water Logged!
            </Text>
            <Text style={styles.subtitle}>
              {isHighConfidence
                ? `App detected ${detectionData?.sipCount || 2} drinking motions with ${confidencePercent}% confidence. Water intake recorded automatically.`
                : `We detected you took ${detectionData?.sipCount || 2} sip${
                    (detectionData?.sipCount || 2) > 1 ? "s" : ""
                  } of water. Confirm?`}
            </Text>
          </View>

          <View style={styles.details}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Estimated Amount</Text>
              <Text style={styles.detailValue}>~{estimateWaterAmount(detectionData?.sipCount)} ml</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Detection Confidence</Text>
              <Text style={[styles.detailValue, isHighConfidence && { color: "#00e5a0" }]}>
                {confidencePercent}% {isHighConfidence && "✓"}
              </Text>
            </View>
          </View>

          {!isHighConfidence && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={handleDismiss}
                disabled={loading}
              >
                <Text style={styles.btnCancelText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnConfirm, loading && { opacity: 0.7 }]}
                onPress={handleConfirm}
                disabled={loading}
              >
                <Text style={styles.btnConfirmText}>
                  {loading ? "Saving..." : "Confirm"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.footer}>
            {isHighConfidence
              ? "Motion analysis verified drinking. No action needed."
              : "Powered by advanced motion sensors."}
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#111827",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#1e2535",
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#00e5a0",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7a99",
    lineHeight: 20,
  },
  details: {
    backgroundColor: "#0a0e1a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#1e2535",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1e2535",
  },
  detailLabel: {
    fontSize: 12,
    color: "#6b7a99",
    fontWeight: "600",
  },
  detailValue: {
    fontSize: 14,
    color: "#00e5a0",
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  btnCancel: {
    flex: 1,
    backgroundColor: "#1e2535",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a3f4f",
  },
  btnCancelText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6b7a99",
  },
  btnConfirm: {
    flex: 1,
    backgroundColor: "#00e5a0",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnConfirmText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0a0e1a",
  },
  footer: {
    fontSize: 11,
    color: "#4a5a7a",
    textAlign: "center",
    lineHeight: 16,
  },
});
