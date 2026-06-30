// services/hydrationAutoTracker.js
// Advanced hydration detection using multiple sensors and motion patterns.
//
// IMPORTANT SCOPE NOTE: this only runs reliably while the app is in the
// foreground. Both iOS and Android aggressively suspend JS execution and
// sensor listeners once an app is backgrounded — there is no reliable way
// to keep continuous accelerometer/gyroscope sampling running silently in
// the background in a managed Expo app. This is intentional, not a bug:
// see AutoHydrationTracker.jsx for the foreground-only lifecycle, paired
// with scheduled reminder notifications and a manual quick-log button to
// cover the times the app isn't open.

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

// Latest gyroscope reading, updated by its own listener and read by the
// accelerometer listener for combined analysis. This is the fix for the
// previous bug where gyro data was always {0,0,0} because nothing ever
// stored it for the accelerometer callback to read.
let latestGyroData = { x: 0, y: 0, z: 0, timestamp: 0 };
const GYRO_STALENESS_MS = 500; // ignore gyro readings older than this when combining with accel

// Enhanced detection parameters
const SIP_WINDOW_MS = 2500;          // 2.5 second window for a drinking motion
const MIN_CONFIDENCE_TO_LOG = 0.65;  // Lowered from 0.82 - see note below
const EMIT_COOLDOWN_MS = 45000;      // Wait 45 seconds between detections
const MIN_SESSION_MS = 8000;         // Wait 8 seconds before considering first sip

// Motion thresholds for detecting hand-to-mouth pattern
const UPWARD_ACCELERATION_THRESHOLD = 0.5;   // Hand lifting up
const ROTATION_THRESHOLD = 0.3;               // Wrist rotation (drinking angle)
const VERTICAL_ACCEL_THRESHOLD = 0.45;       // Z-axis acceleration (up/down)

/**
 * Advanced drinking motion detection
 * Detects: Upward hand motion + wrist rotation + downward motion
 */
const analyzeDrinkingPattern = (accelData, gyroData) => {
  if (!accelData) return { isDrinking: false, confidence: 0, patterns: {} };

  const { x: ax, y: ay, z: az } = accelData;
  const { x: gx, y: gy } = gyroData || { x: 0, y: 0 };

  const accelMagnitude = Math.sqrt(ax * ax + ay * ay + az * az);

  let drinkingScore = 0;

  // Pattern 1: Upward hand motion (Z-axis positive acceleration)
  if (az > VERTICAL_ACCEL_THRESHOLD) {
    drinkingScore += 0.25;
  }

  // Pattern 2: Wrist rotation during upward motion (gyroscope) — now actually reads live data
  if (Math.abs(gx) > ROTATION_THRESHOLD || Math.abs(gy) > ROTATION_THRESHOLD) {
    drinkingScore += 0.25;
  }

  // Pattern 3: Forward/backward head tilt (X-axis acceleration)
  if (Math.abs(ax) > UPWARD_ACCELERATION_THRESHOLD) {
    drinkingScore += 0.15;
  }

  // Pattern 4: Overall motion intensity (must be gentle, not violent shake)
  if (accelMagnitude > 0.5 && accelMagnitude < 2.5) {
    drinkingScore += 0.15;
  }

  // Pattern 5: Y-axis consistency (side-to-side should be minimal)
  if (Math.abs(ay) < 0.5) {
    drinkingScore += 0.20;
  }

  return {
    isDrinking: drinkingScore > MIN_CONFIDENCE_TO_LOG,
    confidence: Math.min(1, drinkingScore),
    patterns: {
      upwardMotion: az > VERTICAL_ACCEL_THRESHOLD,
      wristRotation: Math.abs(gx) > ROTATION_THRESHOLD || Math.abs(gy) > ROTATION_THRESHOLD,
      headTilt: Math.abs(ax) > UPWARD_ACCELERATION_THRESHOLD,
      naturalSpeed: accelMagnitude > 0.5 && accelMagnitude < 2.5,
      stableHold: Math.abs(ay) < 0.5,
    },
  };
};

const recordMotionEvent = (analysis) => {
  const now = Date.now();

  motionBuffer.push({
    confidence: analysis.confidence,
    isDrinking: analysis.isDrinking,
    patterns: analysis.patterns,
    timestamp: now,
  });

  motionBuffer = motionBuffer.filter((e) => now - e.timestamp < SIP_WINDOW_MS);

  const drinkingDetections = motionBuffer.filter((e) => e.isDrinking).length;
  const avgConfidence =
    motionBuffer.length > 0
      ? motionBuffer.reduce((sum, e) => sum + e.confidence, 0) / motionBuffer.length
      : 0;

  return {
    drinkingDetections,
    averageConfidence: avgConfidence,
    shouldLog: drinkingDetections >= 3 && avgConfidence > MIN_CONFIDENCE_TO_LOG,
  };
};

export const startHydrationAutoTracking = async ({ userId, sourceDevice = "PHONE" }) => {
  if (accelSubscription || gyroSubscription) return;

  trackingUserId = userId;
  trackingStartedAt = Date.now();
  motionBuffer = [];
  latestGyroData = { x: 0, y: 0, z: 0, timestamp: 0 };

  Accelerometer.setUpdateInterval(200);
  Gyroscope.setUpdateInterval(200);

  console.log("[Hydration] Starting motion detection (foreground) for user:", userId);

  // Gyroscope listener now actually stores its data for the accelerometer
  // callback to read, with a timestamp so we can detect stale readings.
  gyroSubscription = Gyroscope.addListener((gyroData) => {
    latestGyroData = { ...gyroData, timestamp: Date.now() };
  });

  accelSubscription = Accelerometer.addListener(async (accelData) => {
    const now = Date.now();

    // Only use gyro data if it's fresh; otherwise treat as unavailable
    // rather than silently using stale/zeroed values.
    const gyroIsFresh = now - latestGyroData.timestamp < GYRO_STALENESS_MS;
    const gyroDataForAnalysis = gyroIsFresh ? latestGyroData : { x: 0, y: 0, z: 0 };

    const analysis = analyzeDrinkingPattern(accelData, gyroDataForAnalysis);
    const evaluation = recordMotionEvent(analysis);

    if (
      now - trackingStartedAt >= MIN_SESSION_MS &&
      evaluation.shouldLog &&
      now - lastEmitTime > EMIT_COOLDOWN_MS
    ) {
      lastEmitTime = now;

      console.log("[Hydration] High-confidence drinking detected", {
        confidence: (evaluation.averageConfidence * 100).toFixed(1) + "%",
        detections: evaluation.drinkingDetections,
        patterns: analysis.patterns,
      });

      hydrationEmitter.emit(HYDRATION_EVENTS.DETECTED, {
        userId: trackingUserId,
        sipCount: evaluation.drinkingDetections,
        sourceDevice,
        sensorType: "ADVANCED_MOTION_PATTERN",
        confidenceScore: Math.min(1, evaluation.averageConfidence * 1.1),
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

  console.log("[Hydration] Stopped motion detection (app backgrounded or unmounted)");
};
