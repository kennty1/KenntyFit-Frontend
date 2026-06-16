// Nigerian foods data — same logic as web version, no browser APIs needed

export const nigerianFoods = {
  breakfast: [
    { id: "b1", name: "Akara & Pap", image: "🫘", description: "Bean cakes served with smooth corn porridge. High protein Nigerian breakfast.", calories: "320 kcal", protein: "18g", prepTime: "25 mins", ingredients: ["Black-eyed peas", "Onion", "Pepper", "Palm oil", "Corn flour"] },
    { id: "b2", name: "Oatmeal with Banana", image: "🥣", description: "Rolled oats cooked with fresh banana and a drizzle of honey.", calories: "280 kcal", protein: "9g", prepTime: "10 mins", ingredients: ["Rolled oats", "Banana", "Honey", "Milk", "Cinnamon"] },
    { id: "b3", name: "Boiled Yam & Egg", image: "🥚", description: "Sliced yam boiled tender and served with fried or scrambled eggs.", calories: "410 kcal", protein: "14g", prepTime: "20 mins", ingredients: ["Yam", "Eggs", "Salt", "Tomato", "Pepper"] },
    { id: "b4", name: "Moi Moi", image: "🫙", description: "Steamed bean pudding packed with protein. A Lagos breakfast staple.", calories: "260 kcal", protein: "16g", prepTime: "45 mins", ingredients: ["Beans", "Eggs", "Fish", "Pepper", "Onion"] },
    { id: "b5", name: "Plantain & Beans", image: "🍌", description: "Fried sweet plantain paired with seasoned brown beans.", calories: "480 kcal", protein: "15g", prepTime: "30 mins", ingredients: ["Plantain", "Brown beans", "Palm oil", "Onion", "Crayfish"] },
  ],
  lunch: [
    { id: "l1", name: "Jollof Rice & Chicken", image: "🍚", description: "Classic Nigerian party jollof rice cooked in rich tomato sauce with grilled chicken.", calories: "620 kcal", protein: "38g", prepTime: "50 mins", ingredients: ["Long grain rice", "Chicken", "Tomatoes", "Pepper", "Onion"] },
    { id: "l2", name: "Egusi Soup & Eba", image: "🍲", description: "Ground melon seed soup rich in healthy fats paired with cassava fufu.", calories: "580 kcal", protein: "28g", prepTime: "45 mins", ingredients: ["Egusi seeds", "Eba", "Beef", "Spinach", "Palm oil"] },
    { id: "l3", name: "Vegetable Stir Fry & Rice", image: "🥦", description: "Colourful mixed vegetable stir fry served over steamed white rice.", calories: "390 kcal", protein: "12g", prepTime: "20 mins", ingredients: ["Mixed vegetables", "Rice", "Soy sauce", "Garlic", "Ginger"] },
    { id: "l4", name: "Grilled Fish & Plantain", image: "🐟", description: "Spiced grilled tilapia with fried ripe plantain and pepper sauce.", calories: "450 kcal", protein: "42g", prepTime: "30 mins", ingredients: ["Tilapia", "Plantain", "Suya spice", "Lemon", "Pepper"] },
    { id: "l5", name: "Ofe Onugbu & Pounded Yam", image: "🌿", description: "Bitter leaf soup slow cooked with assorted meats and crayfish.", calories: "540 kcal", protein: "32g", prepTime: "60 mins", ingredients: ["Bitter leaf", "Pounded yam", "Goat meat", "Stockfish", "Palm oil"] },
  ],
  dinner: [
    { id: "d1", name: "Pepper Soup", image: "🍵", description: "Light spiced broth with catfish or goat meat. Low calorie and warming.", calories: "220 kcal", protein: "28g", prepTime: "35 mins", ingredients: ["Catfish", "Pepper soup spice", "Utazi leaf", "Onion", "Scent leaf"] },
    { id: "d2", name: "Vegetable Soup & Oat Fufu", image: "🥬", description: "Healthy mixed vegetable soup served with oat-based fufu for fewer calories.", calories: "380 kcal", protein: "22g", prepTime: "30 mins", ingredients: ["Mixed greens", "Oats", "Prawns", "Crayfish", "Palm oil"] },
    { id: "d3", name: "Grilled Chicken Salad", image: "🥗", description: "Sliced grilled chicken breast on fresh garden salad with lemon dressing.", calories: "310 kcal", protein: "36g", prepTime: "20 mins", ingredients: ["Chicken breast", "Lettuce", "Tomato", "Cucumber", "Lemon"] },
    { id: "d4", name: "Banga Soup & Starch", image: "🌴", description: "Delta-style palm nut soup cooked with fresh fish and local spices.", calories: "490 kcal", protein: "25g", prepTime: "50 mins", ingredients: ["Palm nuts", "Starch", "Catfish", "Oburunbebe", "Onion"] },
    { id: "d5", name: "Okra Soup & Semovita", image: "✨", description: "Silky okra soup with assorted meat and periwinkle served with semovita.", calories: "430 kcal", protein: "24g", prepTime: "40 mins", ingredients: ["Okra", "Semovita", "Beef", "Periwinkle", "Palm oil"] },
  ],
};

export const getMealSuggestion = () => {
  const hour = new Date().getHours();
  let type = "lunch";
  if (hour < 11) type = "breakfast";
  else if (hour >= 18) type = "dinner";

  const meals = nigerianFoods[type];
  const meal = meals[Math.floor(Math.random() * meals.length)];
  return { type, meal };
};
