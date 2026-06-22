import axios from "axios";
import { Platform } from "react-native";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

const getExpoExtra = () => {
  return (
    Constants?.expoConfig?.extra ||
    Constants?.manifest?.extra ||
    Constants?.manifest2?.extra ||
    {}
  );
};

// Utility: Decode JWT token to check expiration
const decodeToken = (token) => {
  try {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload.padEnd(payload.length + (4 - (payload.length % 4)) % 4, "=");

    const decodeBase64 = (str) => {
      if (typeof atob === "function") return atob(str);
      if (typeof globalThis?.atob === "function") return globalThis.atob(str);
      if (typeof Buffer !== "undefined" && typeof Buffer.from === "function") return Buffer.from(str, "base64").toString("utf8");
      return null;
    };

    const decodedPayload = decodeBase64(padded);
    if (!decodedPayload) return null;
    return JSON.parse(decodedPayload);
  } catch {
    return null;
  }
};

// Utility: Check if token is expired
const isTokenExpired = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || typeof decoded !== "object") {
    // If we cannot decode the token or it has no exp claim, avoid false-positive expiration.
    return false;
  }
  const expValue = decoded.exp;
  const expSeconds = Number(expValue);
  if (!Number.isFinite(expSeconds) || expSeconds <= 0) {
    return false;
  }
  const expiryTime = expSeconds * 1000; // Convert to milliseconds
  return expiryTime < Date.now();
};

/**
 * IMPORTANT: Platform-specific backend URLs
 * 
 * iOS Simulator: http://localhost:8081 (localhost works)
 * iOS Physical Device: http://172.16.16.178:8081 (needs MACHINE IP)
 * Android Emulator: http://10.0.2.2:8081 (special alias)
 * Android Physical: http://172.16.16.189:8081 (needs MACHINE IP)
 * Web: http://localhost:8081
 */

const getBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  const expoExtra = getExpoExtra();
  const expoExtraUrl = expoExtra.apiBaseUrl || expoExtra.EXPO_PUBLIC_API_URL;

  if (envUrl) {
    console.log(`[API] Using EXPO_PUBLIC_API_URL from process.env: ${envUrl}`);
    return envUrl;
  }

  if (expoExtraUrl) {
    console.log(`[API] Using API base URL from Expo config extra: ${expoExtraUrl}`);
    return expoExtraUrl;
  }

  if (Platform.OS === "android") {
    const guessedAndroidUrl = Constants.isDevice ? "https://kennty-fit-tracker-backend-production.up.railway.app" : "http://10.0.2.2:8081"; //"http://172.16.16.178:8081" : "http://10.0.2.2:8081";
    console.log(`[API] Android detected - no configured URL found, using fallback: ${guessedAndroidUrl}`);
    return guessedAndroidUrl;
  }

  if (Platform.OS === "ios") {
    const guessedIosUrl = Constants.isDevice ?  "https://kennty-fit-tracker-backend-production.up.railway.app" : "http://10.0.2.2:8081";
    console.log(`[API] iOS detected - no configured URL found, using fallback: ${guessedIosUrl}`);
    return guessedIosUrl;
  }

  const defaultUrl = "http://localhost:8081";
  console.log(`[API] No configured URL found; defaulting to ${defaultUrl}`);
  return defaultUrl;
};

const rawBaseUrl = getBaseUrl();
const API_BASE_URL = rawBaseUrl.replace(/\/$/, "").endsWith("/api")
  ? rawBaseUrl.replace(/\/$/, "")
  : `${rawBaseUrl.replace(/\/$/, "")}/api`;

console.log(`[Init] Platform: ${Platform.OS}, API Base: ${API_BASE_URL}`);

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds for slower networks
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Credentials": "true",
  },
  withCredentials: true, // Include credentials in CORS requests
});

// Request interceptor - Add Authorization token to every request
API.interceptors.request.use(
  async (config) => {
    // Dynamically retrieve token from storage on each request
    try {
      const storedToken = await AsyncStorage.getItem("token");
      config.headers = config.headers || {};
      
      if (storedToken) {
        // Check if token is expired BEFORE sending request
        if (isTokenExpired(storedToken)) {
          console.warn(`[API] ⚠️ Token is EXPIRED - clearing storage and rejecting request`);
          await AsyncStorage.removeItem("token");
          return Promise.reject(new Error("Token expired. Please re-login."));
        }
        
        config.headers.Authorization = `Bearer ${storedToken}`;
        const decoded = decodeToken(storedToken);
        const expiresAt = decoded?.exp ? new Date(Number(decoded.exp) * 1000).toISOString() : "unknown";
        console.log(`[API] ✓ Token attached (expires: ${expiresAt})`);
      } else {
        console.warn(`[API] ⚠ No token found in storage`);
      }
    } catch (e) {
      console.error(`[API] Error retrieving token:`, e);
      return Promise.reject(e);
    }
    
    console.log(`[API] ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => {
    console.log(`[API] ✓ ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    const hasAuth = error.config?.headers?.Authorization;
    
    // Check token expiration for debugging
    let isExpired = false;
    try {
      const storedToken = await AsyncStorage.getItem("token");
      if (storedToken) {
        isExpired = isTokenExpired(storedToken);
      }
    } catch (e) {
      // Ignore
    }
    
    // Enhanced error logging for debugging
    console.error("API Error:", {
      status: status,
      url: url,
      data: error.response?.data,
      message: error.message,
      code: error.code,
      authHeader: hasAuth ? "Yes" : "NO (Missing)",
      tokenExpired: isExpired ? "YES (Re-login required)" : "No",
    });
    
    // Specific guidance for 403 Forbidden
    if (status === 403) {
      console.error(`[API] 🔐 Forbidden (403): Access denied to ${url}`);
      console.error(`[API] Token present: ${hasAuth ? 'Yes' : 'NO'}`);
      console.error(`[API] Token expired: ${isExpired ? 'YES ⚠️' : 'No'}`);
      console.error(`[API] Troubleshooting:`);
      console.error(`     • Check if your token is expired (try logging in again)`);
      console.error(`     • Verify user has permission for this endpoint`);
      console.error(`     • Check backend logs for specific permission errors`);
    }
    
    return Promise.reject(error);
  }
);

export default API;
export { API_BASE_URL };
