import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import API from "../api/axios";
import { getMealsByCountry } from "../utils/nigerianFoods";

const FILTER_TYPES = ["all", "breakfast", "lunch", "dinner", "favorites"];
const MEAL_ICON_MAP = {
  breakfast: "egg-fried",
  lunch: "rice",
  dinner: "food-variant",
  favorites: "heart-outline",
};

const getMealIcon = (type) => MEAL_ICON_MAP[String(type || "").toLowerCase()] || "silverware-fork-knife";

export default function MealSuggestions() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [selectedType, setSelectedType] = useState("all");
  const [suggestionSet, setSuggestionSet] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    AsyncStorage.getItem("favoriteMeals").then((saved) => {
      if (saved) setFavorites(JSON.parse(saved));
    }).catch(() => {});
  }, []);

  const fetchSuggestions = useCallback(async (isRefresh = false) => {
    if (!user?.id) { setLoading(false); return; }
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError("");

    const country = user?.country || "Nigeria";
    const healthStatus = user?.healthStatus || "None";
    const fallbackSet = {
      breakfast: getMealsByCountry(country, "breakfast", healthStatus),
      lunch: getMealsByCountry(country, "lunch", healthStatus),
      dinner: getMealsByCountry(country, "dinner", healthStatus),
    };

    setSuggestionSet(null);

    try {
      const res = await API.get(`/meal-suggestions/user/${user.id}`);
      const hasRemoteMeals = Boolean(
        res?.data?.breakfast?.length || res?.data?.lunch?.length || res?.data?.dinner?.length
      );

      if (hasRemoteMeals) {
        setSuggestionSet({
          breakfast: res.data?.breakfast?.length ? res.data.breakfast : [],
          lunch: res.data?.lunch?.length ? res.data.lunch : [],
          dinner: res.data?.dinner?.length ? res.data.dinner : [],
        });
      } else {
        setSuggestionSet(fallbackSet);
        setError("Gemini suggestions were unavailable, so fallback meals are being shown.");
      }
    } catch (e) {
      setSuggestionSet(fallbackSet);
      setError("Gemini suggestions are currently unavailable. Showing fallback meals instead.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, user?.country, user?.healthStatus]);

  useEffect(() => { fetchSuggestions(); }, [fetchSuggestions]);

  const saveFavorites = async (updated) => {
    setFavorites(updated);
    await AsyncStorage.setItem("favoriteMeals", JSON.stringify(updated));
  };

  const isFavorited = (meal) => favorites.some((f) => f.id === meal.id);

  const toggleFavorite = (meal) => {
    const isFav = isFavorited(meal);
    const updated = isFav
      ? favorites.filter((f) => f.id !== meal.id)
      : [...favorites, meal];
    saveFavorites(updated);
  };

  const allMeals = useMemo(() => {
    if (!suggestionSet) return [];
    return [
      ...(suggestionSet.breakfast || []),
      ...(suggestionSet.lunch || []),
      ...(suggestionSet.dinner || []),
    ];
  }, [suggestionSet]);

  const displayMeals = useMemo(() => {
    if (selectedType === "favorites") return favorites;
    if (selectedType === "all") return allMeals;
    return (suggestionSet?.[selectedType]) || [];
  }, [selectedType, allMeals, favorites, suggestionSet]);

  const styles = useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.background },
    container: { padding: 20, paddingBottom: 40 },
    center: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60 },
    titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
    titleLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
    title: { fontSize: 24, fontWeight: "800", color: theme.text },
    refreshBtn: { padding: 8 },
    sub: { fontSize: 13, color: theme.muted, marginBottom: 20 },
    alertWarn: { backgroundColor: "rgba(251,191,36,0.1)", borderRadius: 8, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "rgba(251,191,36,0.3)" },
    alertText: { color: "#fbbf24", fontSize: 13 },
    filterScroll: { marginBottom: 20 },
    filterBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, marginRight: 8, borderWidth: 1, borderColor: theme.border },
    filterBtnActive: { backgroundColor: theme.accent, borderColor: theme.accent },
    filterContent: { flexDirection: "row", alignItems: "center", gap: 6 },
    filterText: { fontSize: 13, fontWeight: "600", color: theme.muted },
    filterTextActive: { color: theme.accentText },
    emptyCard: { backgroundColor: theme.surface, borderRadius: 14, padding: 40, alignItems: "center", borderWidth: 1, borderColor: theme.border },
    emptyIcon: { marginBottom: 10 },
    emptyText: { fontSize: 14, color: theme.muted, textAlign: "center" },
    mealCard: { backgroundColor: theme.surface, borderRadius: 14, overflow: "hidden", marginBottom: 16, borderWidth: 1, borderColor: theme.border },
    mealBanner: { backgroundColor: theme.accent, padding: 28, alignItems: "center", justifyContent: "center", position: "relative" },
    mealBannerIconWrap: { width: 68, height: 68, borderRadius: 34, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.14)" },
    favBtn: { position: "absolute", top: 10, right: 10, backgroundColor: theme.surface, borderRadius: 20, width: 34, height: 34, alignItems: "center", justifyContent: "center" },
    mealContent: { padding: 16 },
    mealTypeLabel: { fontSize: 10, color: theme.accent, textTransform: "uppercase", letterSpacing: 1, fontWeight: "700", marginBottom: 4 },
    mealName: { fontSize: 16, fontWeight: "700", color: theme.text, marginBottom: 6 },
    mealDesc: { fontSize: 13, color: theme.muted, marginBottom: 12, lineHeight: 18 },
    mealStats: { flexDirection: "row", gap: 8, marginBottom: 12 },
    mealStatBox: { flex: 1, backgroundColor: "rgba(0,229,160,0.08)", borderRadius: 6, padding: 8 },
    mealStatLabel: { fontSize: 10, color: theme.muted, marginBottom: 2 },
    mealStatValue: { fontSize: 14, fontWeight: "700", color: theme.text },
    ingredientsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
    ingredientTag: { backgroundColor: "rgba(0,229,160,0.12)", borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 },
    ingredientText: { fontSize: 11, color: theme.accent },
    prepTime: { fontSize: 12, color: theme.muted },
  }), [theme]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator size="large" color={theme.accent} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <View style={styles.titleLeft}>
            <MaterialCommunityIcons name="food-apple-outline" size={24} color={theme.accent} />
            <Text style={styles.title}>Food Suggestions</Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchSuggestions(true)} disabled={refreshing}>
            {refreshing
              ? <ActivityIndicator size="small" color={theme.accent} />
              : <MaterialCommunityIcons name="refresh" size={22} color={theme.accent} />}
          </TouchableOpacity>
        </View>
        <Text style={styles.sub}>
          Gemini-generated meals for {user?.country || "your country"} · {user?.healthStatus || "None"}
        </Text>

        {error ? <View style={styles.alertWarn}><Text style={styles.alertText}>{error}</Text></View> : null}

        {/* Filter tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {FILTER_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.filterBtn, selectedType === type && styles.filterBtnActive]}
              onPress={() => setSelectedType(type)}
            >
              <View style={styles.filterContent}>
                <MaterialCommunityIcons
                  name={type === "all" ? "silverware-fork-knife" : getMealIcon(type)}
                  size={14}
                  color={selectedType === type ? theme.accentText : theme.muted}
                />
                <Text style={[styles.filterText, selectedType === type && styles.filterTextActive]}>
                  {type === "all" ? "All Meals"
                    : type === "favorites" ? `Favorites (${favorites.length})`
                    : type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Meals grid */}
        {displayMeals.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons
              name={selectedType === "favorites" ? "heart-outline" : "silverware-fork-knife"}
              size={36}
              color={theme.accent}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyText}>
              {selectedType === "favorites" ? "No favorites yet! Save some meals you like." : "No suggestions found."}
            </Text>
          </View>
        ) : (
          displayMeals.map((meal) => (
            <View key={meal.id} style={styles.mealCard}>
              <View style={styles.mealBanner}>
                <View style={styles.mealBannerIconWrap}>
                  <MaterialCommunityIcons name={getMealIcon(meal.mealType)} size={36} color="#fff" />
                </View>
                <TouchableOpacity style={styles.favBtn} onPress={() => toggleFavorite(meal)}>
                  <MaterialCommunityIcons
                    name={isFavorited(meal) ? "heart" : "heart-outline"}
                    size={18}
                    color={isFavorited(meal) ? "#ff6b6b" : theme.muted}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.mealContent}>
                <Text style={styles.mealTypeLabel}>{meal.mealType}</Text>
                <Text style={styles.mealName}>{meal.name}</Text>
                <Text style={styles.mealDesc} numberOfLines={2}>{meal.description}</Text>

                <View style={styles.mealStats}>
                  <View style={styles.mealStatBox}>
                    <Text style={styles.mealStatLabel}>Calories</Text>
                    <Text style={styles.mealStatValue}>{meal.calories} kcal</Text>
                  </View>
                  <View style={styles.mealStatBox}>
                    <Text style={styles.mealStatLabel}>Protein</Text>
                    <Text style={styles.mealStatValue}>{meal.protein}g</Text>
                  </View>
                </View>

                {Array.isArray(meal.ingredients) && (
                  <View style={styles.ingredientsRow}>
                    {meal.ingredients.slice(0, 3).map((ing, i) => (
                      <View key={i} style={styles.ingredientTag}>
                        <Text style={styles.ingredientText}>{ing}</Text>
                      </View>
                    ))}
                    {meal.ingredients.length > 3 && (
                      <Text style={styles.prepTime}>+{meal.ingredients.length - 3}</Text>
                    )}
                  </View>
                )}

                <Text style={styles.prepTime}>
                  <MaterialCommunityIcons name="clock-outline" size={12} color={theme.muted} /> {meal.prepTime}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
