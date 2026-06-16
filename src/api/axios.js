import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

// ⚠️ IMPORTANT: Replace this with your actual backend URL
// Use your computer's local IP address (not localhost) when testing on a physical device
// Example: http://192.168.1.100:8080/api
const API_BASE_URL = "http://192.168.1.100:8080/api";

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // Increased to 60s for slower networks
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Credentials": "true",
  },
  withCredentials: true, // Include credentials in CORS requests
});

// Request interceptor - Add Authorization token to every request
API.interceptors.request.use(
  async (config) => {
    try {
      const storedToken = await AsyncStorage.getItem("token");
      config.headers = config.headers || {};
      
      if (storedToken) {
        // Check if token is expired BEFORE sending request
        if (isTokenExpired(storedToken)) {
          console.warn(`[API] ⚠️ Token is EXPIRED - clearing storage and rejecting request`);
          // Clear expired token from storage
          await AsyncStorage.removeItem("token");
          // Reject the request to prevent using expired token
          return Promise.reject(new Error("Token expired. Please re-login."));
        }
        
        config.headers.Authorization = `Bearer ${storedToken}`;
        const decoded = decodeToken(storedToken);
        const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000).toISOString() : "unknown";
        console.log(`[API] ✓ Token attached (expires: ${expiresAt})`);
      } else {
        console.warn(`[API] ⚠ No token found in storage for ${config.url}`);
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

// Response interceptor - Enhanced error logging
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
