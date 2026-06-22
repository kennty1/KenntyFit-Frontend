// Meal suggestion data and helpers for country-based and health-aware suggestions.

export const nigerianFoods = {
  breakfast: [
    { id: "b1", name: "Akara & Pap", image: "🫘", description: "Bean cakes served with smooth corn porridge. High protein Nigerian breakfast.", calories: "320 kcal", protein: "18g", prepTime: "25 mins", ingredients: ["Black-eyed peas", "Onion", "Pepper", "Palm oil", "Corn flour"], tags: ["high-protein", "fried"] },
    { id: "b2", name: "Oatmeal with Banana", image: "🥣", description: "Rolled oats cooked with fresh banana and a drizzle of honey.", calories: "280 kcal", protein: "9g", prepTime: "10 mins", ingredients: ["Rolled oats", "Banana", "Honey", "Milk", "Cinnamon"], tags: ["low-fat", "high-fiber"] },
    { id: "b3", name: "Boiled Yam & Egg", image: "🥚", description: "Sliced yam boiled tender and served with fried or scrambled eggs.", calories: "410 kcal", protein: "14g", prepTime: "20 mins", ingredients: ["Yam", "Eggs", "Salt", "Tomato", "Pepper"], tags: ["high-carb", "protein"] },
    { id: "b4", name: "Moi Moi", image: "🫙", description: "Steamed bean pudding packed with protein. A Lagos breakfast staple.", calories: "260 kcal", protein: "16g", prepTime: "45 mins", ingredients: ["Beans", "Eggs", "Fish", "Pepper", "Onion"], tags: ["high-protein", "steamed"] },
    { id: "b5", name: "Plantain & Beans", image: "🍌", description: "Fried sweet plantain paired with seasoned brown beans.", calories: "480 kcal", protein: "15g", prepTime: "30 mins", ingredients: ["Plantain", "Brown beans", "Palm oil", "Onion", "Crayfish"], tags: ["fried", "high-carb"] },
  ],
  lunch: [
    { id: "l1", name: "Jollof Rice & Chicken", image: "🍚", description: "Classic Nigerian party jollof rice cooked in rich tomato sauce with grilled chicken.", calories: "620 kcal", protein: "38g", prepTime: "50 mins", ingredients: ["Long grain rice", "Chicken", "Tomatoes", "Pepper", "Onion"], tags: ["high-carb", "protein"] },
    { id: "l2", name: "Egusi Soup & Eba", image: "🍲", description: "Ground melon seed soup rich in healthy fats paired with cassava fufu.", calories: "580 kcal", protein: "28g", prepTime: "45 mins", ingredients: ["Egusi seeds", "Eba", "Beef", "Spinach", "Palm oil"], tags: ["high-fat", "red-meat"] },
    { id: "l3", name: "Vegetable Stir Fry & Rice", image: "🥦", description: "Colourful mixed vegetable stir fry served over steamed white rice.", calories: "390 kcal", protein: "12g", prepTime: "20 mins", ingredients: ["Mixed vegetables", "Rice", "Soy sauce", "Garlic", "Ginger"], tags: ["low-fat", "high-fiber"] },
    { id: "l4", name: "Grilled Fish & Plantain", image: "🐟", description: "Spiced grilled tilapia with fried ripe plantain and pepper sauce.", calories: "450 kcal", protein: "42g", prepTime: "30 mins", ingredients: ["Tilapia", "Plantain", "Suya spice", "Lemon", "Pepper"], tags: ["lean-protein", "low-sodium"] },
    { id: "l5", name: "Ofe Onugbu & Pounded Yam", image: "🌿", description: "Bitter leaf soup slow cooked with assorted meats and crayfish.", calories: "540 kcal", protein: "32g", prepTime: "60 mins", ingredients: ["Bitter leaf", "Pounded yam", "Goat meat", "Stockfish", "Palm oil"], tags: ["moderate-fat", "red-meat"] },
  ],
  dinner: [
    { id: "d1", name: "Pepper Soup", image: "🍵", description: "Light spiced broth with catfish or goat meat. Low calorie and warming.", calories: "220 kcal", protein: "28g", prepTime: "35 mins", ingredients: ["Catfish", "Pepper soup spice", "Utazi leaf", "Onion", "Scent leaf"], tags: ["low-carb", "low-fat"] },
    { id: "d2", name: "Vegetable Soup & Oat Fufu", image: "🥬", description: "Healthy mixed vegetable soup served with oat-based fufu for fewer calories.", calories: "380 kcal", protein: "22g", prepTime: "30 mins", ingredients: ["Mixed greens", "Oats", "Prawns", "Crayfish", "Palm oil"], tags: ["high-fiber", "moderate-fat"] },
    { id: "d3", name: "Grilled Chicken Salad", image: "🥗", description: "Sliced grilled chicken breast on fresh garden salad with lemon dressing.", calories: "310 kcal", protein: "36g", prepTime: "20 mins", ingredients: ["Chicken breast", "Lettuce", "Tomato", "Cucumber", "Lemon"], tags: ["lean-protein", "low-fat"] },
    { id: "d4", name: "Banga Soup & Starch", image: "🌴", description: "Delta-style palm nut soup cooked with fresh fish and local spices.", calories: "490 kcal", protein: "25g", prepTime: "50 mins", ingredients: ["Palm nuts", "Starch", "Catfish", "Oburunbebe", "Onion"], tags: ["moderate-fat", "seafood"] },
    { id: "d5", name: "Okra Soup & Semovita", image: "✨", description: "Silky okra soup with assorted meat and periwinkle served with semovita.", calories: "430 kcal", protein: "24g", prepTime: "40 mins", ingredients: ["Okra", "Semovita", "Beef", "Periwinkle", "Palm oil"], tags: ["moderate-fat", "red-meat"] },
  ],
};

const countryMeals = {
  Nigeria: {
    breakfast: [
      { id: "ng-b1", name: "Akara & Pap", description: "Bean cakes served with smooth corn porridge. High protein Nigerian breakfast.", calories: "320 kcal", protein: "18g", prepTime: "25 mins", ingredients: ["Black-eyed peas", "Onion", "Pepper", "Palm oil", "Corn flour"], tags: ["high-protein", "fried"] },
      { id: "ng-b2", name: "Oatmeal with Banana", description: "Rolled oats cooked with fresh banana and a drizzle of honey.", calories: "280 kcal", protein: "9g", prepTime: "10 mins", ingredients: ["Rolled oats", "Banana", "Honey", "Milk", "Cinnamon"], tags: ["low-fat", "high-fiber"] },
      { id: "ng-b3", name: "Boiled Yam & Egg", description: "Sliced yam boiled tender and served with fried or scrambled eggs.", calories: "410 kcal", protein: "14g", prepTime: "20 mins", ingredients: ["Yam", "Eggs", "Salt", "Tomato", "Pepper"], tags: ["high-carb", "protein"] },
      { id: "ng-b4", name: "Moi Moi", description: "Steamed bean pudding packed with protein. A Lagos breakfast staple.", calories: "260 kcal", protein: "16g", prepTime: "45 mins", ingredients: ["Beans", "Eggs", "Fish", "Pepper", "Onion"], tags: ["high-protein", "steamed"] },
      { id: "ng-b5", name: "Plantain & Beans", description: "Fried sweet plantain paired with seasoned brown beans.", calories: "480 kcal", protein: "15g", prepTime: "30 mins", ingredients: ["Plantain", "Brown beans", "Palm oil", "Onion", "Crayfish"], tags: ["fried", "high-carb"] },
    ],
    lunch: [
      { id: "ng-l1", name: "Jollof Rice & Chicken", description: "Classic Nigerian party jollof rice cooked in rich tomato sauce with grilled chicken.", calories: "620 kcal", protein: "38g", prepTime: "50 mins", ingredients: ["Brown rice", "Chicken breast", "Tomatoes", "Onions", "Peppers"], tags: ["high-carb", "protein"] },
      { id: "ng-l2", name: "Egusi Soup & Eba", description: "Ground melon seed soup rich in healthy fats paired with cassava eba.", calories: "580 kcal", protein: "28g", prepTime: "45 mins", ingredients: ["Egusi", "Eba", "Beef", "Spinach", "Palm oil"], tags: ["high-fat", "red-meat"] },
      { id: "ng-l3", name: "Grilled Fish & Veggies", description: "Spiced grilled fish with a side of steamed vegetables.", calories: "420 kcal", protein: "38g", prepTime: "30 mins", ingredients: ["Tilapia", "Broccoli", "Carrots", "Lemon", "Garlic"], tags: ["lean-protein", "low-sodium"] },
      { id: "ng-l4", name: "Vegetable Stir Fry & Rice", description: "Colourful vegetable stir fry served over steamed white rice.", calories: "390 kcal", protein: "12g", prepTime: "20 mins", ingredients: ["Mixed vegetables", "Rice", "Soy sauce", "Garlic", "Ginger"], tags: ["low-fat", "high-fiber"] },
      { id: "ng-l5", name: "Beans & Whole Wheat Bread", description: "Stewed beans with whole wheat toast for sustained energy.", calories: "360 kcal", protein: "20g", prepTime: "25 mins", ingredients: ["Brown beans", "Whole wheat bread", "Tomato", "Onion", "Spices"], tags: ["high-fiber", "vegetarian"] },
    ],
    dinner: [
      { id: "ng-d1", name: "Pepper Soup", description: "Light spiced broth with fish or chicken to aid digestion.", calories: "220 kcal", protein: "28g", prepTime: "35 mins", ingredients: ["Catfish", "Pepper soup spice", "Utazi leaf", "Onion", "Scent leaf"], tags: ["low-carb", "low-fat"] },
      { id: "ng-d2", name: "Grilled Chicken Salad", description: "Sliced grill chicken breast on a fresh garden salad with lemon dressing.", calories: "310 kcal", protein: "36g", prepTime: "20 mins", ingredients: ["Chicken breast", "Lettuce", "Tomato", "Cucumber", "Lemon"], tags: ["lean-protein", "low-fat"] },
      { id: "ng-d3", name: "Vegetable Soup & Oat Fufu", description: "Mixed greens soup with oat fufu for lighter dinner digestion.", calories: "380 kcal", protein: "22g", prepTime: "30 mins", ingredients: ["Mixed greens", "Oats", "Prawns", "Crayfish", "Palm oil"], tags: ["high-fiber", "moderate-fat"] },
      { id: "ng-d4", name: "Okra Soup & Semovita", description: "Silky okra soup with lean meat and semovita on the side.", calories: "430 kcal", protein: "24g", prepTime: "40 mins", ingredients: ["Okra", "Semovita", "Beef", "Periwinkle", "Palm oil"], tags: ["moderate-fat", "red-meat"] },
      { id: "ng-d5", name: "Avocado Egg Toast", description: "Whole grain toast topped with avocado and boiled egg.", calories: "320 kcal", protein: "14g", prepTime: "15 mins", ingredients: ["Whole grain bread", "Avocado", "Egg", "Salt", "Pepper"], tags: ["vegetarian", "healthy-fat"] },
    ],
  },
  "United States": {
    breakfast: [
      { id: "us-b1", name: "Greek Yogurt Bowl", description: "Creamy yogurt topped with berries and nuts.", calories: "310 kcal", protein: "18g", prepTime: "10 mins", ingredients: ["Greek yogurt", "Berries", "Granola", "Honey", "Almonds"], tags: ["high-protein", "low-fat"] },
      { id: "us-b2", name: "Avocado Toast", description: "Whole grain toast with mashed avocado and seasoning.", calories: "290 kcal", protein: "9g", prepTime: "10 mins", ingredients: ["Whole grain bread", "Avocado", "Lemon", "Chili flakes"], tags: ["vegetarian", "healthy-fat"] },
    ],
    lunch: [
      { id: "us-l1", name: "Grilled Turkey Salad", description: "Lean turkey breast over mixed greens and vinaigrette.", calories: "360 kcal", protein: "32g", prepTime: "20 mins", ingredients: ["Turkey breast", "Lettuce", "Tomato", "Cucumber", "Olive oil"], tags: ["lean-protein", "low-sodium"] },
      { id: "us-l2", name: "Quinoa & Veggie Bowl", description: "Nutritious quinoa with roasted vegetables and herbs.", calories: "410 kcal", protein: "14g", prepTime: "25 mins", ingredients: ["Quinoa", "Zucchini", "Bell pepper", "Feta", "Olive oil"], tags: ["vegetarian", "high-fiber"] },
    ],
    dinner: [
      { id: "us-d1", name: "Salmon & Broccoli", description: "Oven-baked salmon with steamed broccoli and lemon.", calories: "380 kcal", protein: "34g", prepTime: "30 mins", ingredients: ["Salmon", "Broccoli", "Lemon", "Garlic", "Olive oil"], tags: ["omega-3", "lean-protein"] },
      { id: "us-d2", name: "Veggie Stir Fry", description: "Mixed vegetables stir-fried in light soy sauce.", calories: "320 kcal", protein: "12g", prepTime: "20 mins", ingredients: ["Broccoli", "Carrot", "Snap peas", "Soy sauce", "Ginger"], tags: ["vegetarian", "low-fat"] },
    ],
  },
  India: {
    breakfast: [
      { id: "in-b1", name: "Poha", description: "Light flattened rice cooked with vegetables and spices.", calories: "290 kcal", protein: "8g", prepTime: "20 mins", ingredients: ["Poha", "Peanut", "Onion", "Mustard seeds", "Curry leaves"], tags: ["low-fat", "vegetarian"] },
      { id: "in-b2", name: "Idli & Sambar", description: "Steamed rice cakes served with lentil stew.", calories: "310 kcal", protein: "10g", prepTime: "30 mins", ingredients: ["Rice", "Urad dal", "Lentils", "Tomato", "Spices"], tags: ["low-fat", "vegetarian"] },
    ],
    lunch: [
      { id: "in-l1", name: "Dal & Brown Rice", description: "Comforting lentil curry with whole grain rice.", calories: "420 kcal", protein: "18g", prepTime: "35 mins", ingredients: ["Lentils", "Brown rice", "Tomato", "Onion", "Turmeric"], tags: ["vegetarian", "high-fiber"] },
      { id: "in-l2", name: "Chicken Tikka Salad", description: "Grilled chicken pieces over a bed of greens.", calories: "380 kcal", protein: "34g", prepTime: "25 mins", ingredients: ["Chicken", "Yogurt", "Lettuce", "Tomato", "Spices"], tags: ["lean-protein", "low-fat"] },
    ],
    dinner: [
      { id: "in-d1", name: "Palak Paneer", description: "Spinach curry with cottage cheese and light spices.", calories: "360 kcal", protein: "18g", prepTime: "30 mins", ingredients: ["Spinach", "Paneer", "Tomatoes", "Garlic", "Ginger"], tags: ["vegetarian", "high-fiber"] },
      { id: "in-d2", name: "Grilled Fish Curry", description: "Light fish curry cooked with turmeric and coconut milk.", calories: "390 kcal", protein: "35g", prepTime: "35 mins", ingredients: ["Fish", "Coconut milk", "Turmeric", "Curry leaves", "Chili"], tags: ["lean-protein", "low-sodium"] },
    ],
  },
  Ghana: {
    breakfast: [
      { id: "gh-b1", name: "Maize Porridge", description: "Warm corn porridge with milk and a touch of honey.", calories: "300 kcal", protein: "8g", prepTime: "15 mins", ingredients: ["Maize flour", "Milk", "Honey", "Nutmeg", "Salt"], tags: ["low-fat", "vegetarian"] },
      { id: "gh-b2", name: "Boiled Yam & Egg", description: "Classic Ghanaian breakfast with eggs and boiled yam.", calories: "420 kcal", protein: "16g", prepTime: "20 mins", ingredients: ["Yam", "Eggs", "Tomato", "Onion", "Pepper"], tags: ["high-carb", "protein"] },
    ],
    lunch: [
      { id: "gh-l1", name: "Light Jollof & Chicken", description: "Smaller-portion jollof with lean chicken thigh.", calories: "450 kcal", protein: "32g", prepTime: "45 mins", ingredients: ["Rice", "Tomatoes", "Chicken", "Pepper", "Onion"], tags: ["high-carb", "protein"] },
      { id: "gh-l2", name: "Palava Sauce & Yam", description: "Greens stew with groundnuts over boiled yam.", calories: "410 kcal", protein: "14g", prepTime: "35 mins", ingredients: ["Kontomire", "Groundnuts", "Yam", "Tomato", "Onion"], tags: ["vegetarian", "high-fiber"] },
    ],
    dinner: [
      { id: "gh-d1", name: "Groundnut Soup", description: "Nutty soup with lean fish and light vegetables.", calories: "390 kcal", protein: "30g", prepTime: "45 mins", ingredients: ["Groundnut", "Fish", "Tomato", "Spinach", "Spices"], tags: ["moderate-fat", "lean-protein"] },
      { id: "gh-d2", name: "Garden Egg Stew", description: "Light stew of garden eggs and greens with low oil.", calories: "320 kcal", protein: "10g", prepTime: "30 mins", ingredients: ["Garden eggs", "Tomato", "Onion", "Spinach", "Palm oil"], tags: ["vegetarian", "low-fat"] },
    ],
  },
  Kenya: {
    breakfast: [
      { id: "ke-b1", name: "Uji Porridge", description: "Sorghum porridge offering light energy and hydration.", calories: "280 kcal", protein: "7g", prepTime: "15 mins", ingredients: ["Sorghum flour", "Water", "Milk", "Sugar", "Salt"], tags: ["low-fat", "vegetarian"] },
      { id: "ke-b2", name: "Mandazi & Tea", description: "A lighter fried bread served sparingly with tea.", calories: "340 kcal", protein: "6g", prepTime: "20 mins", ingredients: ["Flour", "Coconut milk", "Sugar", "Yeast", "Oil"], tags: ["fried", "high-carb"] },
    ],
    lunch: [
      { id: "ke-l1", name: "Chapati & Vegetable Curry", description: "Flatbread paired with a vegetable curry.", calories: "420 kcal", protein: "12g", prepTime: "35 mins", ingredients: ["Chapati", "Potato", "Carrot", "Peas", "Spices"], tags: ["vegetarian", "moderate-fat"] },
      { id: "ke-l2", name: "Grilled Tilapia & Salad", description: "Fresh tilapia with salad and lemon dressing.", calories: "410 kcal", protein: "34g", prepTime: "30 mins", ingredients: ["Tilapia", "Lettuce", "Tomato", "Cucumber", "Lemon"], tags: ["lean-protein", "low-sodium"] },
    ],
    dinner: [
      { id: "ke-d1", name: "Ugali & Sukuma Wiki", description: "Cornmeal with sautéed greens and light seasoning.", calories: "360 kcal", protein: "12g", prepTime: "25 mins", ingredients: ["Cornmeal", "Kale", "Onion", "Tomato", "Oil"], tags: ["vegetarian", "high-fiber"] },
      { id: "ke-d2", name: "Lentil Stew", description: "Spiced lentils simmered with tomatoes and carrots.", calories: "330 kcal", protein: "14g", prepTime: "25 mins", ingredients: ["Lentils", "Tomatoes", "Carrots", "Garlic", "Ginger"], tags: ["vegetarian", "high-fiber"] },
    ],
  },
};

const healthFilters = {
  Diabetes: (meal) => !meal.tags?.includes("high-sugar") && !meal.tags?.includes("fried") && !meal.tags?.includes("high-carb"),
  Hypertension: (meal) => !meal.tags?.includes("high-sodium") && !meal.tags?.includes("processed") && !meal.tags?.includes("fried"),
  "High Cholesterol": (meal) => !meal.tags?.includes("high-fat") && !meal.tags?.includes("high-cholesterol") && !meal.tags?.includes("fried") && !meal.tags?.includes("red-meat"),
  Vegetarian: (meal) => !meal.tags?.includes("meat") && !meal.tags?.includes("fish") && !meal.tags?.includes("poultry") && !meal.tags?.includes("seafood"),
  None: () => true,
};

export const getMealsByCountry = (country = "Nigeria", mealType = "breakfast", healthStatus = "None") => {
  const normalizedCountry = countryMeals[country] ? country : "Nigeria";
  const meals = countryMeals[normalizedCountry]?.[mealType] || [];
  const filter = healthFilters[healthStatus] || healthFilters.None;
  const filtered = meals.filter(filter);
  return filtered.length > 0 ? filtered : meals;
};

export const getMealSuggestion = (country = "Nigeria", healthStatus = "None") => {
  const hour = new Date().getHours();
  let type = "lunch";
  if (hour < 11) type = "breakfast";
  else if (hour >= 18) type = "dinner";

  const meals = getMealsByCountry(country, type, healthStatus);
  const meal = meals[Math.floor(Math.random() * meals.length)] || getMealsByCountry("Nigeria", type, healthStatus)[0];
  return { type, meal };
};
