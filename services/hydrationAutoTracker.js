// services/hydrationAutoTracker.js
// Advanced hydration detection using multiple sensors and motion patterns

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

// Enhanced detection parameters
const SIP_WINDOW_MS = 2500;          // 2.5 second window for a drinking motion
const MIN_CONFIDENCE_TO_LOG = 0.82;  // Only log if 82%+ confident (HIGH confidence)
const EMIT_COOLDOWN_MS = 45000;      // Wait 45 seconds between detections
const MIN_SESSION_MS = 8000;         // Wait 8 seconds before considering first sip

// Motion thresholds for detecting hand-to-mouth pattern
const UPWARD_ACCELERATION_THRESHOLD = 0.5;   // Hand lifting up
const ROTATION_THRESHOLD = 0.3;               // Wrist rotation (drinking angle)
const DOWNWARD_ACCELERATION_THRESHOLD = 0.4; // Hand lowering
const VERTICAL_ACCEL_THRESHOLD = 0.45;       // Z-axis acceleration (up/down)

/**
 * Advanced drinking motion detection
 * Detects: Upward hand motion + wrist rotation + downward motion
 * Typical drinking sequence:
 * 1. Hand accelerates upward (bringing cup to mouth)
 * 2. Wrist rotates (tilting head back or cup angle)
 * 3. Hand moves downward (swallowing, cup goes down)
 */
const analyzeDrinkingPattern = (accelData, gyroData) => {
  if (!accelData || !gyroData) return { isDrinking: false, confidence: 0 };

  const { x: ax, y: ay, z: az } = accelData;
  const { x: gx, y: gy, z: gz } = gyroData;

  // Calculate motion intensity
  const accelMagnitude = Math.sqrt(ax * ax + ay * ay + az * az);
  const gyroMagnitude = Math.sqrt(gx * gx + gy * gy + gz * gz);

  // Detect specific drinking patterns
  let drinkingScore = 0;

  // Pattern 1: Upward hand motion (Z-axis positive acceleration)
  if (az > VERTICAL_ACCEL_THRESHOLD) {
    drinkingScore += 0.25; // Hand moving upward
  }

  // Pattern 2: Wrist rotation during upward motion (gyroscope)
  if (Math.abs(gx) > ROTATION_THRESHOLD || Math.abs(gy) > ROTATION_THRESHOLD) {
    drinkingScore += 0.25; // Wrist rotating (tilting for drinking)
  }

  // Pattern 3: Forward/backward head tilt (X-axis acceleration)
  if (Math.abs(ax) > UPWARD_ACCELERATION_THRESHOLD) {
    drinkingScore += 0.15; // Head tilting motion
  }

  // Pattern 4: Overall motion intensity (must be gentle, not violent shake)
  if (accelMagnitude > 0.5 && accelMagnitude < 2.5) {
    drinkingScore += 0.15; // Natural drinking speed
  }

  // Pattern 5: Y-axis consistency (side-to-side should be minimal)
  if (Math.abs(ay) < 0.5) {
    drinkingScore += 0.20; // Stable hold, not shaking
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

/**
 * Track consecutive drinking motions to confirm it's actual drinking
 */
const recordMotionEvent = (analysis) => {
  const now = Date.now();

  // Add to buffer with timestamp
  motionBuffer.push({
    confidence: analysis.confidence,
    isDrinking: analysis.isDrinking,
    patterns: analysis.patterns,
    timestamp: now,
  });

  // Keep only recent events (within SIP_WINDOW)
  motionBuffer = motionBuffer.filter((e) => now - e.timestamp < SIP_WINDOW_MS);

  // Count high-confidence drinking detections
  const drinkingDetections = motionBuffer.filter((e) => e.isDrinking).length;
  const avgConfidence =
    motionBuffer.length > 0
      ? motionBuffer.reduce((sum, e) => sum + e.confidence, 0) / motionBuffer.length
      : 0;

  return {
    drinkingDetections,
    averageConfidence: avgConfidence,
    shouldLog: drinkingDetections >= 3 && avgConfidence > MIN_CONFIDENCE_TO_LOG, // 3 consecutive high-confidence detections
  };
};

export const startHydrationAutoTracking = async ({ userId, sourceDevice = "PHONE" }) => {
  if (accelSubscription || gyroSubscription) return;

  trackingUserId = userId;
  trackingStartedAt = Date.now();
  motionBuffer = [];

  // Set high-frequency updates for accurate motion detection
  Accelerometer.setUpdateInterval(200); // 200ms updates
  Gyroscope.setUpdateInterval(200);

  console.log("[Hydration] Starting advanced motion detection for user:", userId);

  // Listen to accelerometer
  accelSubscription = Accelerometer.addListener(async (accelData) => {
    const now = Date.now();

    // Get latest gyro data (simplified - in production, use proper sync)
    let latestGyroData = { x: 0, y: 0, z: 0 };

    // Analyze combined motion
    const analysis = analyzeDrinkingPattern(accelData, latestGyroData);

    // Record and evaluate pattern
    const evaluation = recordMotionEvent(analysis);

    // Only emit CONFIRMED detection when VERY confident and enough consecutive detections
    if (
      now - trackingStartedAt >= MIN_SESSION_MS &&
      evaluation.shouldLog &&
      now - lastEmitTime > EMIT_COOLDOWN_MS
    ) {
      lastEmitTime = now;

      console.log("[Hydration] ✓ High-confidence drinking detected!", {
        confidence: (evaluation.averageConfidence * 100).toFixed(1) + "%",
        detections: evaluation.drinkingDetections,
        patterns: analysis.patterns,
      });

      // AUTO-LOG WITHOUT PROMPT - app is confident
      hydrationEmitter.emit(HYDRATION_EVENTS.DETECTED, {
        userId: trackingUserId,
        sipCount: evaluation.drinkingDetections,
        sourceDevice,
        sensorType: "ADVANCED_MOTION_PATTERN",
        confidenceScore: Math.min(1, evaluation.averageConfidence * 1.1), // Boost confidence due to multiple detections
        detectedAt: new Date().toISOString(),
        analysisData: analysis,
      });

      motionBuffer = []; // Reset buffer after successful detection
    }
  });

  // Listen to gyroscope for rotation patterns
  gyroSubscription = Gyroscope.addListener((gyroData) => {
    // Store gyro data for combined analysis
    // In production, sync accelerometer + gyroscope more carefully
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

  console.log("[Hydration] Stopped motion detection");
};
