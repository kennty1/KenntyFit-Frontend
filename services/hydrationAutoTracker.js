// services/hydrationAutoTracker.js
// Motion-based hydration detection using accelerometer + gyroscope.
// The tracker stays active while the app is alive so it can keep watching for drinking patterns.

import { Accelerometer, Gyroscope } from "expo-sensors";
import { EventEmitter } from "eventemitter3";

export const HYDRATION_EVENTS = {
  DETECTED: "hydration:detected",
  CONFIRMED: "hydration:confirmed",
};

export const hydrationEmitter = new EventEmitter();

let accelSubscription = null;
let gyroSubscription = null;
let trackingUserId = null;
let motionBuffer = [];
let lastEmitTime = 0;
let trackingStartedAt = 0;
let latestGyroData = { x: 0, y: 0, z: 0, timestamp: 0 };

// ── Detection parameters (tuned for real-world sensitivity) ──────────────────
const SIP_WINDOW_MS = 3000;
const MIN_CONFIDENCE_TO_LOG = 0.72;
const EMIT_COOLDOWN_MS = 300000;
const MIN_SESSION_MS = 8000;
const GYRO_STALENESS_MS = 700;
const MIN_CONSECUTIVE = 4;

// ── Motion thresholds (lowered for better real-world sensitivity) ────────────
const UPWARD_ACCELERATION_THRESHOLD = 0.3;  // Was 0.5
const ROTATION_THRESHOLD = 0.2;             // Was 0.3
const VERTICAL_ACCEL_THRESHOLD = 0.4; // Raised slightly       // Was 0.45

const analyzeDrinkingPattern = (accelData, gyroData) => {
  if (!accelData) return { isDrinking: false, confidence: 0, patterns: {} };

  const { x: ax, y: ay, z: az } = accelData;
  const { x: gx, y: gy } = gyroData || { x: 0, y: 0 };

  const accelMagnitude = Math.sqrt(ax * ax + ay * ay + az * az);

  let drinkingScore = 0;

  // Pattern 1: Upward hand motion (Z-axis) — lowered threshold
  if (az > VERTICAL_ACCEL_THRESHOLD) {
    drinkingScore += 0.25;
  }

  // Pattern 2: Wrist rotation (gyroscope) — lowered threshold
  if (Math.abs(gx) > ROTATION_THRESHOLD || Math.abs(gy) > ROTATION_THRESHOLD) {
    drinkingScore += 0.25;
  }

  // Pattern 3: Forward/backward tilt — lowered threshold
  if (Math.abs(ax) > UPWARD_ACCELERATION_THRESHOLD) {
    drinkingScore += 0.20;
  }

  // Pattern 4: Natural drinking speed — widened range (was 0.5-2.5, now 0.3-3.0)
  if (accelMagnitude > 0.3 && accelMagnitude < 3.0) {
    drinkingScore += 0.15;
  }

  // Pattern 5: Stable side-to-side — relaxed (was < 0.5, now < 0.8)
  if (Math.abs(ay) < 0.8) {
    drinkingScore += 0.15;
  }

  return {
    isDrinking: drinkingScore >= MIN_CONFIDENCE_TO_LOG,
    confidence: Math.min(1, drinkingScore),
    patterns: {
      upwardMotion: az > VERTICAL_ACCEL_THRESHOLD,
      wristRotation: Math.abs(gx) > ROTATION_THRESHOLD || Math.abs(gy) > ROTATION_THRESHOLD,
      headTilt: Math.abs(ax) > UPWARD_ACCELERATION_THRESHOLD,
      naturalSpeed: accelMagnitude > 0.3 && accelMagnitude < 3.0,
      stableHold: Math.abs(ay) < 0.8,
    },
  };
};

const recordMotionEvent = (analysis) => {
  const now = Date.now();

  motionBuffer.push({
    confidence: analysis.confidence,
    isDrinking: analysis.isDrinking,
    timestamp: now,
  });

  // Keep only events within the sip window
  motionBuffer = motionBuffer.filter((e) => now - e.timestamp < SIP_WINDOW_MS);

  const drinkingDetections = motionBuffer.filter((e) => e.isDrinking).length;
  const avgConfidence =
    motionBuffer.length > 0
      ? motionBuffer.reduce((sum, e) => sum + e.confidence, 0) / motionBuffer.length
      : 0;

  return {
    drinkingDetections,
    averageConfidence: avgConfidence,
    shouldLog: drinkingDetections >= MIN_CONSECUTIVE && avgConfidence >= MIN_CONFIDENCE_TO_LOG,
  };
};

export const startHydrationAutoTracking = async ({ userId, sourceDevice = "PHONE" }) => {
  if (accelSubscription || gyroSubscription) return;

  trackingUserId = userId;
  trackingStartedAt = Date.now();
  motionBuffer = [];
  latestGyroData = { x: 0, y: 0, z: 0, timestamp: 0 };

  // Higher frequency for better detection
  Accelerometer.setUpdateInterval(150); // Was 200ms
  Gyroscope.setUpdateInterval(150);

  console.log("[Hydration] Motion detection started for user:", userId);

  // Gyroscope stores its latest reading so the accel listener can read it
  gyroSubscription = Gyroscope.addListener((gyroData) => {
    latestGyroData = { ...gyroData, timestamp: Date.now() };
  });

  accelSubscription = Accelerometer.addListener(async (accelData) => {
    const now = Date.now();

    const gyroIsFresh = now - latestGyroData.timestamp < GYRO_STALENESS_MS;
    const gyroForAnalysis = gyroIsFresh ? latestGyroData : { x: 0, y: 0, z: 0 };

    const analysis = analyzeDrinkingPattern(accelData, gyroForAnalysis);
    const evaluation = recordMotionEvent(analysis);

    if (
      now - trackingStartedAt >= MIN_SESSION_MS &&
      evaluation.shouldLog &&
      now - lastEmitTime > EMIT_COOLDOWN_MS
    ) {
      lastEmitTime = now;

      console.log("[Hydration] Drinking detected", {
        confidence: (evaluation.averageConfidence * 100).toFixed(1) + "%",
        detections: evaluation.drinkingDetections,
      });

      hydrationEmitter.emit(HYDRATION_EVENTS.DETECTED, {
        userId: trackingUserId,
        sipCount: evaluation.drinkingDetections,
        sourceDevice,
        sensorType: "ADVANCED_MOTION_PATTERN",
        confidenceScore: Math.min(1, evaluation.averageConfidence),
        detectedAt: new Date().toISOString(),
        analysisData: analysis,
      });

      motionBuffer = [];
    }
  });
};

export const stopHydrationAutoTracking = async () => {
  if (accelSubscription) {
    accelSubscription.remove();
    accelSubscription = null;
  }
  if (gyroSubscription) {
    gyroSubscription.remove();
    gyroSubscription = null;
  }
  motionBuffer = [];
  trackingUserId = null;
  trackingStartedAt = 0; 
  latestGyroData = { x: 0, y: 0, z: 0, timestamp: 0 };

  console.log("[Hydration] Motion detection stopped");
};