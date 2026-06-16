import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, FlatList,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../context/AuthContext";
import { getMealsByCountry, getMealSuggestion } from "../utils/nigerianFoods";

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
  const [selectedType, setSelectedType] = useState("all");
  const [suggestion, setSuggestion] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const { user } = useAuth();
  const activeCountry = user?.country || "Nigeria";
  const activeHealthStatus = user?.healthStatus || "None";

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  // Load favorites from AsyncStorage (replaces localStorage)
  useEffect(() => {
    AsyncStorage.getItem("favoriteMeals").then((saved) => {
      if (saved) setFavorites(JSON.parse(saved));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setSuggestion(getMealSuggestion(activeCountry, activeHealthStatus));
  }, [activeCountry, activeHealthStatus]);

  const saveFavorites = async (updated) => {
    setFavorites(updated);
    await AsyncStorage.setItem("favoriteMeals", JSON.stringify(updated));
  };

  const toggleFavorite = (meal, mealType) => {
    const isFav = favorites.some((f) => f.id === meal.id && f.mealType === mealType);
    const updated = isFav
      ? favorites.filter((f) => !(f.id === meal.id && f.mealType === mealType))
      : [...favorites, { ...meal, mealType }];
    saveFavorites(updated);
  };

  const isFavorited = (meal, mealType) =>
    favorites.some((f) => f.id === meal.id && f.mealType === mealType);

  const getDisplayMeals = (country, healthStatus) => {
    if (selectedType === "all") {
      return ["breakfast", "lunch", "dinner"].flatMap((type) =>
        getMealsByCountry(country, type, healthStatus).map((meal) => ({ ...meal, mealType: type }))
      );
    }
    if (selectedType === "favorites") return favorites;
    return getMealsByCountry(country, selectedType, healthStatus).map((m) => ({ ...m, mealType: selectedType }));
  };

  const displayMeals = getDisplayMeals(activeCountry, activeHealthStatus);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <MaterialCommunityIcons name="chevron-left" size={24} color="#00e5a0" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="food-apple-outline" size={24} color="#00e5a0" />
          <Text style={styles.title}>Food Suggestions</Text>
        </View>
        <Text style={styles.sub}>Meals from {activeCountry} matched to {activeHealthStatus}</Text>

        {/* Today's Suggestion */}
        {suggestion && (
          <View style={styles.suggestionCard}>
            <View style={styles.suggestionHeader}>
              <View style={styles.suggestionIconWrap}>
                <MaterialCommunityIcons name={getMealIcon(suggestion.type)} size={28} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.suggestionType}>Today's {suggestion.type}</Text>
                <Text style={styles.suggestionName}>{suggestion.meal.name}</Text>
              </View>
            </View>
            <Text style={styles.suggestionDesc}>{suggestion.meal.description}</Text>
            <View style={styles.suggestionStats}>
              {[["Calories", suggestion.meal.calories], ["Protein", suggestion.meal.protein], ["Prep Time", suggestion.meal.prepTime]].map(([k, v]) => (
                <View key={k} style={styles.suggestionStat}>
                  <Text style={styles.suggestionStatLabel}>{k}</Text>
                  <Text style={styles.suggestionStatValue}>{v}</Text>
                </View>
              ))}
            </View>
            <View style={styles.suggestionBtns}>
              <TouchableOpacity style={styles.suggestionBtn} onPress={() => setSuggestion(getMealSuggestion(activeCountry, activeHealthStatus))}>
                <Text style={styles.suggestionBtnText}>
                  <MaterialCommunityIcons name="refresh" size={14} color="#fff" /> Get Another Idea
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.suggestionBtn, isFavorited(suggestion.meal, suggestion.type) && styles.suggestionBtnActive]}
                onPress={() => toggleFavorite(suggestion.meal, suggestion.type)}
              >
                <Text style={styles.suggestionBtnText}>
                  <MaterialCommunityIcons
                    name={isFavorited(suggestion.meal, suggestion.type) ? "heart" : "heart-outline"}
                    size={14}
                    color="#fff"
                  />{" "}
                  {isFavorited(suggestion.meal, suggestion.type) ? "Saved" : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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
                  color={selectedType === type ? "#0a0e1a" : "#6b7a99"}
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
              color="#00e5a0"
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyText}>
              {selectedType === "favorites" ? "No favorites yet! Save some meals." : "No meals found."}
            </Text>
          </View>
        ) : (
          displayMeals.map((meal, idx) => (
            <View key={`${meal.id}-${idx}`} style={styles.mealCard}>
              {/* Image banner */}
              <View style={styles.mealBanner}>
                <View style={styles.mealBannerIconWrap}>
                  <MaterialCommunityIcons name={getMealIcon(meal.mealType)} size={36} color="#fff" />
                </View>
                <TouchableOpacity
                  style={styles.favBtn}
                  onPress={() => toggleFavorite(meal, meal.mealType || selectedType)}
                >
                  <Text style={styles.favBtnText}>
                    <MaterialCommunityIcons
                      name={isFavorited(meal, meal.mealType || selectedType) ? "heart" : "heart-outline"}
                      size={16}
                      color={isFavorited(meal, meal.mealType || selectedType) ? "#ff6b6b" : "#6b7a99"}
                    />
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Content */}
              <View style={styles.mealContent}>
                <Text style={styles.mealName}>{meal.name}</Text>
                <Text style={styles.mealDesc} numberOfLines={2}>{meal.description}</Text>

                {/* Stats */}
                <View style={styles.mealStats}>
                  <View style={styles.mealStatBox}>
                    <Text style={styles.mealStatLabel}>Calories</Text>
                    <Text style={styles.mealStatValue}>{meal.calories}</Text>
                  </View>
                  <View style={styles.mealStatBox}>
                    <Text style={styles.mealStatLabel}>Protein</Text>
                    <Text style={styles.mealStatValue}>{meal.protein}</Text>
                  </View>
                </View>

                {/* Ingredients */}
                <View style={styles.ingredientsRow}>
                  {meal.ingredients.slice(0, 3).map((ing, i) => (
                    <View key={i} style={styles.ingredientTag}>
                      <Text style={styles.ingredientText}>{ing}</Text>
                    </View>
                  ))}
                  {meal.ingredients.length > 3 && (
                    <Text style={styles.ingredientMore}>+{meal.ingredients.length - 3}</Text>
                  )}
                </View>

                <Text style={styles.prepTime}>
                  <MaterialCommunityIcons name="clock-outline" size={12} color="#6b7a99" /> {meal.prepTime}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0e1a" },
  container: { padding: 20, paddingBottom: 40 },
  backBtn: { flexDirection: "row", alignItems: "center", marginBottom: 16, paddingVertical: 8 },
  backText: { fontSize: 16, fontWeight: "600", color: "#00e5a0", marginLeft: 4 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  title: { fontSize: 24, fontWeight: "800", color: "#fff", marginBottom: 4 },
  sub: { fontSize: 13, color: "#6b7a99", marginBottom: 20 },
  suggestionCard: { backgroundColor: "#00b887", borderRadius: 16, padding: 20, marginBottom: 24 },
  suggestionHeader: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 12 },
  suggestionIconWrap: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.18)" },
  suggestionType: { fontSize: 11, color: "rgba(255,255,255,0.85)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 },
  suggestionName: { fontSize: 20, fontWeight: "800", color: "#fff" },
  suggestionDesc: { fontSize: 13, color: "rgba(255,255,255,0.9)", marginBottom: 14, lineHeight: 20 },
  suggestionStats: { flexDirection: "row", gap: 10, marginBottom: 14 },
  suggestionStat: { flex: 1, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 8, padding: 10 },
  suggestionStatLabel: { fontSize: 10, color: "rgba(255,255,255,0.8)", marginBottom: 3 },
  suggestionStatValue: { fontSize: 16, fontWeight: "700", color: "#fff" },
  suggestionBtns: { flexDirection: "row", gap: 10 },
  suggestionBtn: { flex: 1, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 8, padding: 11, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.4)" },
  suggestionBtnActive: { backgroundColor: "rgba(255,255,255,0.35)" },
  suggestionBtnText: { fontSize: 13, fontWeight: "600", color: "#fff" },
  filterScroll: { marginBottom: 20 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, marginRight: 8, borderWidth: 1, borderColor: "#1e2535" },
  filterBtnActive: { backgroundColor: "#00e5a0", borderColor: "#00e5a0" },
  filterContent: { flexDirection: "row", alignItems: "center", gap: 6 },
  filterText: { fontSize: 13, fontWeight: "600", color: "#6b7a99" },
  filterTextActive: { color: "#0a0e1a" },
  emptyCard: { backgroundColor: "#111827", borderRadius: 14, padding: 40, alignItems: "center", borderWidth: 1, borderColor: "#1e2535" },
  emptyIcon: { marginBottom: 10 },
  emptyText: { fontSize: 14, color: "#6b7a99", textAlign: "center" },
  mealCard: { backgroundColor: "#111827", borderRadius: 14, overflow: "hidden", marginBottom: 16, borderWidth: 1, borderColor: "#1e2535" },
  mealBanner: { backgroundColor: "#00b887", padding: 28, alignItems: "center", justifyContent: "center", position: "relative" },
  mealBannerIconWrap: { width: 68, height: 68, borderRadius: 34, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.14)" },
  favBtn: { position: "absolute", top: 10, right: 10, backgroundColor: "#fff", borderRadius: 20, width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  favBtnText: { fontSize: 16 },
  mealContent: { padding: 16 },
  mealName: { fontSize: 16, fontWeight: "700", color: "#fff", marginBottom: 6 },
  mealDesc: { fontSize: 13, color: "#6b7a99", marginBottom: 12, lineHeight: 18 },
  mealStats: { flexDirection: "row", gap: 8, marginBottom: 12 },
  mealStatBox: { flex: 1, backgroundColor: "rgba(0,229,160,0.08)", borderRadius: 6, padding: 8 },
  mealStatLabel: { fontSize: 10, color: "#6b7a99", marginBottom: 2 },
  mealStatValue: { fontSize: 14, fontWeight: "700", color: "#fff" },
  ingredientsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  ingredientTag: { backgroundColor: "rgba(0,229,160,0.12)", borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 },
  ingredientText: { fontSize: 11, color: "#00e5a0" },
  ingredientMore: { fontSize: 11, color: "#6b7a99", paddingVertical: 4 },
  prepTime: { fontSize: 12, color: "#6b7a99" },
});
