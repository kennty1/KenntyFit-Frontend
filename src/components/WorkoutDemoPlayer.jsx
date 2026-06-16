import React, { useEffect, useRef, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Video, ResizeMode } from "expo-av";

const WORKOUT_VIDEOS = {
  FAT_LOSS:    { src: "https://assets.mixkit.co/videos/12795/12795-720.mp4",   title: "Fat loss session",    caption: "Treadmill-based cardio footage" },
  CARDIO:      { src: "https://assets.mixkit.co/videos/49275/49275-720.mp4",   title: "Cardio session",      caption: "Real gym cardio footage" },
  STRENGTH:    { src: "https://assets.mixkit.co/videos/52093/52093-720.mp4",   title: "Strength session",    caption: "Barbell lifting footage" },
  FLEXIBILITY: { src: "https://assets.mixkit.co/videos/44415/44415-720.mp4",   title: "Flexibility session", caption: "Stretching and mobility footage" },
  LOW_IMPACT:  { src: "https://assets.mixkit.co/videos/44440/44440-720.mp4",   title: "Low impact session",  caption: "Gentle gym stretching footage" },
  BEGINNER:    { src: "https://assets.mixkit.co/active_storage/video_items/100526/1725383305/100526-video-720.mp4", title: "Beginner session", caption: "Warm-up and starter movement footage" },
  BALANCED:    { src: "https://assets.mixkit.co/videos/606/606-720.mp4",       title: "Balanced session",    caption: "General fitness footage" },
};

const formatTime = (seconds) => {
  const s = Math.max(0, Math.floor(seconds || 0));
  const m = String(Math.floor(s / 60)).padStart(2, "0");
  const r = String(s % 60).padStart(2, "0");
  return `${m}:${r}`;
};

export default function WorkoutDemoPlayer({ workoutType, routine, elapsedSeconds }) {
  const videoRef = useRef(null);
  const media = useMemo(() => WORKOUT_VIDEOS[workoutType] || WORKOUT_VIDEOS.BALANCED, [workoutType]);

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
        {/* Top-left badge */}
        <View style={styles.badgeLeft}>
          <Text style={styles.badgeText}>Real workout footage</Text>
        </View>
        {/* Timer badge */}
        <View style={styles.badgeRight}>
          <Text style={styles.badgeText}>{formatTime(elapsedSeconds)}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerTitle}>{media.title}</Text>
        <Text style={styles.footerCaption}>{media.caption}</Text>
      </View>

      <Text style={styles.description}>
        {routine?.description || "Select a workout type to load a real workout clip and start timing yourself."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%" },
  videoWrap: { width: "100%", aspectRatio: 16 / 9, borderRadius: 10, overflow: "hidden", backgroundColor: "#0b1020", borderWidth: 1, borderColor: "#1e2535", position: "relative" },
  video: { width: "100%", height: "100%" },
  badgeLeft: { position: "absolute", left: 12, top: 12, backgroundColor: "rgba(11,16,32,0.75)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  badgeRight: { position: "absolute", right: 12, top: 12, backgroundColor: "rgba(11,16,32,0.75)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  footer: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  footerTitle: { fontSize: 12, color: "#6b7a99" },
  footerCaption: { fontSize: 12, color: "#6b7a99" },
  description: { marginTop: 8, fontSize: 13, color: "#6b7a99", lineHeight: 20 },
});
