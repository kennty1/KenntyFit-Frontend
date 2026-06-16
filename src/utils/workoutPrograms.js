// workoutPrograms.js — NO CHANGES NEEDED
// Pure JS data and logic — works identically in React Native.
// Just copy to utils/workoutPrograms.js in your project.

export const workoutPrograms = {
  beginner: [
    { id: 1, name: "Morning Walk",       description: "30-minute brisk walk at steady pace",           duration: 30, calories: 150, difficulty: "Easy",   image: "🚶", instructions: ["Walk at a steady pace","Maintain good posture","Swing arms naturally"],                              benefits: ["Burns calories","Improves endurance","Low impact"] },
    { id: 2, name: "Jump Rope",          description: "Rope jumping exercises for cardio",              duration: 15, calories: 200, difficulty: "Easy",   image: "🪃", instructions: ["Use a comfortable rope","Jump with feet together","Keep arms at waist level","3 sets of 2 minutes"], benefits: ["High calorie burn","Improves coordination","Full body workout"] },
    { id: 3, name: "Bodyweight Squats",  description: "Simple squats to strengthen legs and glutes",   duration: 12, calories: 80,  difficulty: "Easy",   image: "🦵", instructions: ["Keep back straight","Lower your body","Knees over toes","20 reps x 3 sets"],                         benefits: ["Strengthens legs","Burns belly fat","Improves posture"] },
    { id: 4, name: "Push-ups",           description: "Classic upper body exercise",                   duration: 10, calories: 70,  difficulty: "Easy",   image: "💪", instructions: ["Keep body straight","Lower chest to ground","Push back up","10 reps x 3 sets"],                      benefits: ["Strengthens chest and arms","Core engagement","Upper body toning"] },
    { id: 5, name: "Plank Hold",         description: "Core strengthening exercise",                   duration: 5,  calories: 40,  difficulty: "Easy",   image: "📏", instructions: ["Arms shoulder-width apart","Keep body straight","Engage core","Hold for 30 seconds x 3"],            benefits: ["Strengthens core","Better posture","Improves balance"] },
  ],
  intermediate: [
    { id: 1, name: "Running",            description: "30-minute running session",                     duration: 30, calories: 400, difficulty: "Medium", image: "🏃", instructions: ["Start with warm-up walk","Maintain steady pace","Cool down after","3-4 times per week"],             benefits: ["High calorie burn","Cardiovascular health","Great for weight loss"] },
    { id: 2, name: "HIIT",               description: "Alternating intense and recovery periods",      duration: 20, calories: 300, difficulty: "Medium", image: "⚡", instructions: ["30 sec intense effort","30 sec recovery","Repeat 10 times","Exercises: burpees, mountain climbers"], benefits: ["Maximum calorie burn","Improved metabolism","Time efficient"] },
    { id: 3, name: "Cycling",            description: "45-minute cycling session",                     duration: 45, calories: 350, difficulty: "Medium", image: "🚴", instructions: ["Adjust seat height","Maintain steady pace","Mix terrain if possible","Focus on leg strength"],        benefits: ["Strengthens legs","Low impact","High calorie burn"] },
    { id: 4, name: "Strength Training",  description: "Full body strength workout",                    duration: 40, calories: 250, difficulty: "Medium", image: "🏋️", instructions: ["Warm up first","Do compound exercises","3 sets of 8-12 reps","Rest between sets"],                  benefits: ["Builds muscle","Increases metabolism","Tones body"] },
    { id: 5, name: "Swimming",           description: "Full body swim workout",                        duration: 45, calories: 400, difficulty: "Medium", image: "🏊", instructions: ["Different strokes","Continuous movement","Mix pace variations","Great for joints"],                  benefits: ["Full body workout","Low impact","High endurance builder"] },
  ],
};

export const getRandomWorkout = (difficulty = "beginner") => {
  const list = workoutPrograms[difficulty] || workoutPrograms.beginner;
  return list[Math.floor(Math.random() * list.length)];
};

export const getDailyWorkout = () => {
  const h = new Date().getHours();
  if (h >= 5 && h < 9)   return { suggestedTime: "Morning",  workout: getRandomWorkout("beginner"),     motivation: "🌅 Start your day with energy!" };
  if (h >= 16 && h < 19) return { suggestedTime: "Evening",  workout: getRandomWorkout("intermediate"), motivation: "🌆 End your day strong!" };
  return                         { suggestedTime: "Anytime",  workout: getRandomWorkout("beginner"),     motivation: "💪 Every bit counts!" };
};

export const weightLossTips = [
  "💧 Drink at least 8 glasses of water daily",
  "🚶 Take a 30-minute walk after meals",
  "🥗 Eat more vegetables and fruits",
  "😴 Get 7-8 hours of sleep",
  "🚫 Avoid sugary drinks and snacks",
  "🍽️ Eat smaller, frequent meals",
  "⏰ Set regular meal times",
  "🚴 Find an exercise you enjoy",
  "🧘 Practice stress management",
  "📊 Track your progress weekly",
];

export const getTodaysTip = () => weightLossTips[new Date().getDate() % weightLossTips.length];
