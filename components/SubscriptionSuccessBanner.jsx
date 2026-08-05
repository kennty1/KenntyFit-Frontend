import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SubscriptionSuccessBanner() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [slideAnim] = useState(new Animated.Value(-120));

  useEffect(() => {
    const loadMessage = async () => {
      try {
        const raw = await AsyncStorage.getItem("subscriptionSuccess");
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (!parsed?.active) return;

        const plan = parsed.planName || parsed.plan || "plan";
        setMessage(`Congratulations! Your ${plan} plan is now active.`);
        setVisible(true);

        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 240,
          useNativeDriver: true,
        }).start();

        setTimeout(async () => {
          Animated.timing(slideAnim, {
            toValue: -120,
            duration: 240,
            useNativeDriver: true,
          }).start();
          setVisible(false);
          await AsyncStorage.removeItem("subscriptionSuccess");
        }, 4000);
      } catch {
        // ignore
      }
    };

    loadMessage();
  }, [slideAnim]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY: slideAnim }] }]}> 
      <Text style={styles.bannerText}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 12,
    right: 12,
    zIndex: 999,
    backgroundColor: "#00e5a0",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  bannerText: {
    color: "#0a0e1a",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
});
