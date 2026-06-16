import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { View, ActivityIndicator } from "react-native";

// In Expo Router, protection is done inside each screen or layout.
// Use this hook at the top of any protected screen:
//
//   useProtectedRoute();           // any logged-in user
//   useProtectedRoute(true);       // admin only
//
export function useProtectedRoute(adminOnly = false) {
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (adminOnly) {
      const isAdmin = user?.role === "ADMIN" || user?.role === "ROLE_ADMIN";
      if (!isAdmin) router.replace("/(tabs)");
    }
  }, [isAuthenticated, user, loading, adminOnly]);
}

// Optional wrapper component — wraps a screen and redirects if not authenticated
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) { router.replace("/login"); return; }
    if (adminOnly) {
      const isAdmin = user?.role === "ADMIN" || user?.role === "ROLE_ADMIN";
      if (!isAdmin) router.replace("/(tabs)");
    }
  }, [isAuthenticated, user, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0a0e1a" }}>
        <ActivityIndicator size="large" color="#00e5a0" />
      </View>
    );
  }

  if (!isAuthenticated) return null;

  return children;
}
