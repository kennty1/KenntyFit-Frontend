// services/hydrationAutoTracker.js
// Replaces Capacitor + window.addEventListener with React Native EventEmitter + expo-sensors

import { Accelerometer } from "expo-sensors";
import { EventEmitter } from "eventemitter3";

export const HYDRATION_EVENTS = {
  DETECTED: "hydration:detected",
  CONFIRMED: "hydration:confirmed",
};

// Shared event bus — replaces window.dispatchEvent / window.addEventListener
export const hydrationEmitter = new EventEmitter();

let subscription = null;
let trackingUserId = null;
let sipBuffer = [];
let lastEmitTime = 0;
let trackingStartedAt = 0;

const SIP_WINDOW_MS = 3000;     // 3 seconds of motion window
const MIN_SIPS = 2;              // minimum sip-like movements to trigger
const EMIT_COOLDOWN_MS = 30000;  // don't fire again for 30 seconds
const TILT_THRESHOLD = 0.35;    // accelerometer tilt sensitivity
const MIN_SESSION_MS = 10000;    // wait briefly before auto-recording

const detectSipPattern = ({ x, y, z }) => {
  // Detect a wrist-tilt + tilt-back pattern typical of drinking
  const tiltScore = Math.abs(x) + Math.abs(y - 1);
  return tiltScore > TILT_THRESHOLD;
};

export const startHydrationAutoTracking = async ({ userId, sourceDevice = "PHONE" }) => {
  if (subscription) return; // already running
  trackingUserId = userId;
  trackingStartedAt = Date.now();

  // Set update interval
  Accelerometer.setUpdateInterval(500);

  subscription = Accelerometer.addListener((data) => {
    const now = Date.now();

    if (detectSipPattern(data)) {
      sipBuffer.push(now);
    }

    // Clean old entries outside the window
    sipBuffer = sipBuffer.filter((t) => now - t < SIP_WINDOW_MS);

    // Enough sip-like movements detected
    if (
      now - trackingStartedAt >= MIN_SESSION_MS &&
      sipBuffer.length >= MIN_SIPS &&
      now - lastEmitTime > EMIT_COOLDOWN_MS
    ) {
      lastEmitTime = now;
      sipBuffer = [];

      hydrationEmitter.emit(HYDRATION_EVENTS.DETECTED, {
        userId: trackingUserId,
        amountMl: 250,
        sourceDevice,
        sensorType: "MOTION_PATTERN",
        confidenceScore: 0.72,
        sipCount: MIN_SIPS,
        detectedAt: new Date().toISOString(),
      });
    }
  });
};

export const stopHydrationAutoTracking = async () => {
  if (subscription) {
    subscription.remove();
    subscription = null;
  }
  sipBuffer = [];
  trackingUserId = null;
  trackingStartedAt = 0;
};
