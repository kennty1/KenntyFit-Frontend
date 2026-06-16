import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, FlatList,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { nigerianFoods, getMealSuggestion } from "../utils/nigerianFoods";

const FILTER_TYPES = ["all", "breakfast", "lunch", "dinner", "favorites"];

export default function MealSuggestions() {
  const [selectedType, setSelectedType] = useState("all");
  const [suggestion, setSuggestion] = useState(null);
  const [favorites, setFavorites] = useState([]);

  // Load favorites from AsyncStorage (replaces localStorage)
  useEffect(() => {
    AsyncStorage.getItem("favoriteMeals").then((saved) => {
      if (saved) setFavorites(JSON.parse(saved));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setSuggestion(getMealSuggestion());
  }, []);

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

  const getDisplayMeals = () => {
    if (selectedType === "all") {
      return Object.entries(nigerianFoods).flatMap(([type, meals]) =>
        meals.map((meal) => ({ ...meal, mealType: type }))
      );
    }
    if (selectedType === "favorites") return favorites;
    return (nigerianFoods[selectedType] || []).map((m) => ({ ...m, mealType: selectedType }));
  };

  const displayMeals = getDisplayMeals();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>🍲 Food Suggestions</Text>
        <Text style={styles.sub}>Healthy Nigerian meals for your fitness goals</Text>

        {/* Today's Suggestion */}
        {suggestion && (
          <View style={styles.suggestionCard}>
            <View style={styles.suggestionHeader}>
              <Text style={styles.suggestionEmoji}>{suggestion.meal.image}</Text>
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
              <TouchableOpacity style={styles.suggestionBtn} onPress={() => setSuggestion(getMealSuggestion())}>
                <Text style={styles.suggestionBtnText}>🔄 Get Another Idea</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.suggestionBtn, isFavorited(suggestion.meal, suggestion.type) && styles.suggestionBtnActive]}
                onPress={() => toggleFavorite(suggestion.meal, suggestion.type)}
              >
                <Text style={styles.suggestionBtnText}>
                  {isFavorited(suggestion.meal, suggestion.type) ? "❤️ Saved" : "🤍 Save"}
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
              <Text style={[styles.filterText, selectedType === type && styles.filterTextActive]}>
                {type === "all" ? "All Meals"
                  : type === "favorites" ? `❤️ Favorites (${favorites.length})`
                  : type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Meals grid */}
        {displayMeals.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>{selectedType === "favorites" ? "❤️" : "🍽️"}</Text>
            <Text style={styles.emptyText}>
              {selectedType === "favorites" ? "No favorites yet! Save some meals." : "No meals found."}
            </Text>
          </View>
        ) : (
          displayMeals.map((meal, idx) => (
            <View key={`${meal.id}-${idx}`} style={styles.mealCard}>
              {/* Image banner */}
              <View style={styles.mealBanner}>
                <Text style={styles.mealBannerEmoji}>{meal.image}</Text>
                <TouchableOpacity
                  style={styles.favBtn}
                  onPress={() => toggleFavorite(meal, meal.mealType || selectedType)}
                >
                  <Text style={styles.favBtnText}>
                    {isFavorited(meal, meal.mealType || selectedType) ? "❤️" : "🤍"}
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

                <Text style={styles.prepTime}>⏱️ {meal.prepTime}</Text>
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
  title: { fontSize: 24, fontWeight: "800", color: "#fff", marginBottom: 4 },
  sub: { fontSize: 13, color: "#6b7a99", marginBottom: 20 },
  suggestionCard: { backgroundColor: "#00b887", borderRadius: 16, padding: 20, marginBottom: 24 },
  suggestionHeader: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 12 },
  suggestionEmoji: { fontSize: 44 },
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
  filterText: { fontSize: 13, fontWeight: "600", color: "#6b7a99" },
  filterTextActive: { color: "#0a0e1a" },
  emptyCard: { backgroundColor: "#111827", borderRadius: 14, padding: 40, alignItems: "center", borderWidth: 1, borderColor: "#1e2535" },
  emptyEmoji: { fontSize: 36, marginBottom: 10 },
  emptyText: { fontSize: 14, color: "#6b7a99", textAlign: "center" },
  mealCard: { backgroundColor: "#111827", borderRadius: 14, overflow: "hidden", marginBottom: 16, borderWidth: 1, borderColor: "#1e2535" },
  mealBanner: { backgroundColor: "#00b887", padding: 28, alignItems: "center", justifyContent: "center", position: "relative" },
  mealBannerEmoji: { fontSize: 52 },
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
