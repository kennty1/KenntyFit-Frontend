import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../api/axios";

const AuthContext = createContext(null);

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
    return decodedPayload ? JSON.parse(decodedPayload) : null;
  } catch {
    return null;
  }
};

const isTokenExpired = () => false;

const normalizeUser = (data) => {
  if (data?.user && typeof data.user === "object") {
    return data.user;
  }

  if (!data || typeof data !== "object") {
    return null;
  }

  const keys = [
    "id",
    "username",
    "email",
    "firstName",
    "lastName",
    "age",
    "weight",
    "height",
    "gender",
    "fitnessGoal",
    "activityLevel",
    "dailyCalorieTarget",
    "dailyWaterTarget",
    "country",
    "healthStatus",
    "profilePictureUrl",
    "profilePicture",
    "role",
  ];

  const user = {};
  keys.forEach((key) => {
    if (data[key] !== undefined) {
      user[key] = data[key];
    }
  });

  return Object.keys(user).length > 0 ? user : null;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restore = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        const storedUser = await AsyncStorage.getItem("user");
        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);
          API.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
        }
      } catch (e) {
        console.log("Error restoring token:", e);
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

  const login = async (username, password) => {
    const normalizedUsername = String(username || "").trim();
    const normalizedPassword = String(password || "").trim();

    if (!normalizedUsername || !normalizedPassword) {
      throw new Error("Please enter your username/email and password.");
    }

    const loginPayloads = [];
    const usernameCandidate = normalizedUsername;

    if (normalizedUsername.includes("@")) {
      loginPayloads.push({ email: usernameCandidate, password: normalizedPassword });
    }

    loginPayloads.push({ username: usernameCandidate, password: normalizedPassword });
    loginPayloads.push({ email: usernameCandidate, password: normalizedPassword });

    let lastError = null;

    for (const payload of loginPayloads) {
      try {
        const res = await API.post("/auth/login", payload);
        if (res.data?.otpRequired) return res.data;
        const { token: t } = res.data;
        const resolvedUser = normalizeUser(res.data) || res.data?.user;
        if (!t) {
          throw new Error("Login response did not include a token.");
        }
        if (!resolvedUser) {
          throw new Error("Login response did not include user details.");
        }
        await AsyncStorage.setItem("token", t);
        await AsyncStorage.setItem("user", JSON.stringify(resolvedUser));
        API.defaults.headers.common["Authorization"] = `Bearer ${t}`;
        setToken(t);
        setUser(resolvedUser);
        return res.data;
      } catch (err) {
        lastError = err;
        const status = err?.response?.status;
        if (status !== 401 && status !== 400) {
          throw err;
        }
      }
    }

    throw lastError || new Error("Invalid username/email or password.");
  };

  const register = async (username, email, password, form) => {
    const res = await API.post("/auth/register", {
      username, email, password,
      firstName: form.firstName, lastName: form.lastName,
      age: +form.age, weight: +form.weight, height: +form.height,
      gender: form.gender, fitnessGoal: form.fitnessGoal,
      activityLevel: form.activityLevel,
      dailyCalorieTarget: +form.dailyCalorieTarget,
      dailyWaterTarget: +form.dailyWaterTarget,
      country: form.country,
      healthStatus: form.healthStatus,
    });
    return res.data;
  };

  const verifyOtp = async (username, otp) => {
    const res = await API.post("/auth/verify-otp", { username, otp });
    const { token: t } = res.data;
    const resolvedUser = normalizeUser(res.data) || res.data?.user;
    if (!t) {
      throw new Error("OTP verification response did not include a token.");
    }
    if (!resolvedUser) {
      throw new Error("OTP verification response did not include user details.");
    }
    await AsyncStorage.setItem("token", t);
    await AsyncStorage.setItem("user", JSON.stringify(resolvedUser));
    API.defaults.headers.common["Authorization"] = `Bearer ${t}`;
    setToken(t);
    setUser(resolvedUser);
    return res.data;
  };

  const resendOtp = async (username, password) => {
    const res = await API.post("/auth/resend-otp", { username, password });
    return res.data;
  };

  const forgotPassword = async (email) => {
    const res = await API.post("/auth/forgot-password", { email });
    return res.data;
  };

  const resetPassword = async (resetToken, newPassword, confirmPassword) => {
    const res = await API.post("/auth/reset-password", { resetToken, newPassword, confirmPassword });
    return res.data;
  };

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    delete API.defaults.headers.common["Authorization"];
    setToken(null); setUser(null);
  };

  const updateUser = async (updatedUser) => {
    setUser(updatedUser);
    await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{
      user, token, loading, isAuthenticated: !!token,
      login, register, verifyOtp, resendOtp,
      forgotPassword, resetPassword, logout, updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
