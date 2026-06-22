import React, { useEffect, useMemo, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Video, ResizeMode } from "expo-av";

const FALLBACK_VIDEO = "https://assets.mixkit.co/videos/606/606-720.mp4";

const formatTime = (seconds) => {
  const total = Math.max(0, Math.floor(seconds || 0));
  const minutes = String(Math.floor(total / 60)).padStart(2, "0");
  const secs = String(total % 60).padStart(2, "0");
  return `${minutes}:${secs}`;
};

export default function WorkoutDemoPlayer({ routine, workoutType, elapsedSeconds }) {
  const videoRef = useRef(null);

  const media = useMemo(() => {
    const src = routine?.videoUrl || FALLBACK_VIDEO;
    return {
      src,
      title: routine?.name || "Workout preview",
      caption: routine?.description || "Follow along with the selected session.",
      label: routine?.difficulty || workoutType || "Workout",
      focus: routine?.workoutType || workoutType || "Balanced",
    };
  }, [routine, workoutType]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playAsync().catch(() => {});
    }
  }, [media.src]);

  return (
    <View style={styles.container}>
      <View style={styles.videoWrap}>
        <Video
          ref={videoRef}
          source={{ uri: media.src }}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping
          isMuted
          useNativeControls
        />
        <View style={styles.badgeLeft}>
          <Text style={styles.badgeText}>Real workout footage</Text>
        </View>
        <View style={styles.badgeRight}>
          <Text style={styles.badgeText}>{formatTime(elapsedSeconds)}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerTitle}>{media.title}</Text>
        <Text style={styles.footerCaption}>{media.label}</Text>
      </View>

      <Text style={styles.description}>{media.caption}</Text>
      <Text style={styles.focusText}>Type: {media.focus}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%" },
  videoWrap: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#0b1020",
    borderWidth: 1,
    borderColor: "#1e2535",
    position: "relative",
  },
  video: { width: "100%", height: "100%" },
  badgeLeft: {
    position: "absolute",
    left: 12,
    top: 12,
    backgroundColor: "rgba(11,16,32,0.78)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeRight: {
    position: "absolute",
    right: 12,
    top: 12,
    backgroundColor: "rgba(11,16,32,0.78)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  footer: { flexDirection: "row", justifyContent: "space-between", marginTop: 10, gap: 12 },
  footerTitle: { flex: 1, fontSize: 13, color: "#fff", fontWeight: "700" },
  footerCaption: { fontSize: 12, color: "#6b7a99", fontWeight: "600" },
  description: { marginTop: 8, fontSize: 13, color: "#6b7a99", lineHeight: 20 },
  focusText: { marginTop: 4, fontSize: 12, color: "#00e5a0", fontWeight: "700" },
});

