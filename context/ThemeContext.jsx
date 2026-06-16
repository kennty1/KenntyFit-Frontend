import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ThemeContext = createContext(null);
const THEME_PREFERENCE_KEY = "themeMode";

const palettes = {
  dark: {
    mode: "dark",
    background: "#0a0e1a",
    surface: "#111827",
    card: "#111827",
    border: "#1e2535",
    text: "#ffffff",
    muted: "#6b7a99",
    placeholder: "#4a5568",
    accent: "#00e5a0",
    accentText: "#0a0e1a",
    danger: "#ff6b6b",
    warning: "#fbbf24",
    success: "#22c55e",
    inputBackground: "#0d1526",
    inputBorder: "#1e2535",
  },
  light: {
    mode: "light",
    background: "#f8fafc",
    surface: "#ffffff",
    card: "#f1f5f9",
    border: "#e2e8f0",
    text: "#0f172a",
    muted: "#475569",
    placeholder: "#94a3b8",
    accent: "#0f766e",
    accentText: "#ffffff",
    danger: "#dc2626",
    warning: "#d97706",
    success: "#16a34a",
    inputBackground: "#ffffff",
    inputBorder: "#cbd5e1",
  },
};

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const restoreTheme = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
        if (storedValue === "light" || storedValue === "dark") {
          setMode(storedValue);
        } else {
          const system = Appearance.getColorScheme();
          setMode(system === "light" ? "light" : "dark");
        }
      } catch (error) {
        console.log("Theme restore failed", error);
      } finally {
        setReady(true);
      }
    };

    restoreTheme();
  }, []);

  const setTheme = async (nextMode) => {
    if (nextMode !== "light" && nextMode !== "dark") return;
    try {
      setMode(nextMode);
      await AsyncStorage.setItem(THEME_PREFERENCE_KEY, nextMode);
    } catch (error) {
      console.log("Theme save failed", error);
    }
  };

  const toggleTheme = () => setTheme(mode === "dark" ? "light" : "dark");

  const theme = useMemo(() => palettes[mode] || palettes.dark, [mode]);

  return (
    <ThemeContext.Provider value={{ theme, mode, setTheme, toggleTheme, ready }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
