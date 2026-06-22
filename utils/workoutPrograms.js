const VIDEO_CLIPS = {
  CARDIO: "https://assets.mixkit.co/videos/12795/12795-720.mp4",
  JUMP_ROPE: "https://assets.mixkit.co/videos/49275/49275-720.mp4",
  STRENGTH: "https://assets.mixkit.co/videos/52093/52093-720.mp4",
  MOBILITY: "https://assets.mixkit.co/videos/44415/44415-720.mp4",
  LOW_IMPACT: "https://assets.mixkit.co/videos/44440/44440-720.mp4",
  BEGINNER: "https://assets.mixkit.co/active_storage/video_items/100526/1725383305/100526-video-720.mp4",
  BALANCED: "https://assets.mixkit.co/videos/606/606-720.mp4",
};

export const WORKOUT_PLANS = {
  WEIGHT_LOSS: {
    key: "WEIGHT_LOSS",
    label: "Weight Loss",
    subtitle: "Cardio-heavy sessions for higher calorie burn and endurance.",
    accent: "#ff6b6b",
    focus: "Burn calories, improve stamina, and keep the pace high.",
    routines: [
      {
        id: "wl-hiit-burn",
        name: "HIIT Burn",
        workoutType: "HIIT",
        description: "Short, intense intervals that keep your heart rate up.",
        durationMinutes: 20,
        calories: 320,
        difficulty: "Medium",
        videoUrl: VIDEO_CLIPS.CARDIO,
        instructions: [
          "Warm up for 2 minutes before the first interval.",
          "Work hard for 30 seconds, then recover for 30 seconds.",
          "Repeat the cycle for 10 rounds.",
        ],
        benefits: ["Fast calorie burn", "Improves conditioning", "Time efficient"],
      },
      {
        id: "wl-cardio-push",
        name: "Cardio Push",
        workoutType: "CARDIO",
        description: "A steady cardio session to keep fat loss moving.",
        durationMinutes: 30,
        calories: 410,
        difficulty: "Medium",
        videoUrl: VIDEO_CLIPS.BALANCED,
        instructions: [
          "Keep your pace conversational for the first 5 minutes.",
          "Increase effort gradually and hold steady.",
          "Finish with a 3-minute cool down.",
        ],
        benefits: ["Improves heart health", "Supports weight loss", "Builds stamina"],
      },
      {
        id: "wl-jump-rope",
        name: "Jump Rope Sprint",
        workoutType: "CARDIO",
        description: "Explosive rope work for a quick calorie blast.",
        durationMinutes: 15,
        calories: 260,
        difficulty: "Medium",
        videoUrl: VIDEO_CLIPS.JUMP_ROPE,
        instructions: [
          "Keep your elbows close and wrists relaxed.",
          "Jump lightly on the balls of your feet.",
          "Take a short break after every two rounds.",
        ],
        benefits: ["High calorie burn", "Improves coordination", "Full-body activation"],
      },
    ],
  },
  MUSCLE_GAIN: {
    key: "MUSCLE_GAIN",
    label: "Muscle Gain",
    subtitle: "Strength-focused sessions for muscle growth and progressive overload.",
    accent: "#00c2ff",
    focus: "Lift, control, and recover with deliberate strength work.",
    routines: [
      {
        id: "mg-upper-body",
        name: "Upper Body Power",
        workoutType: "STRENGTH",
        description: "Chest, shoulders, back, and arms with controlled reps.",
        durationMinutes: 35,
        calories: 280,
        difficulty: "Hard",
        videoUrl: VIDEO_CLIPS.STRENGTH,
        instructions: [
          "Use a weight that keeps the last two reps challenging.",
          "Control the lowering phase of every rep.",
          "Rest 60 to 90 seconds between sets.",
        ],
        benefits: ["Builds upper-body mass", "Improves push and pull strength", "Supports posture"],
      },
      {
        id: "mg-lower-body",
        name: "Lower Body Load",
        workoutType: "STRENGTH",
        description: "Squats, lunges, and glute work for stronger legs.",
        durationMinutes: 40,
        calories: 330,
        difficulty: "Hard",
        videoUrl: VIDEO_CLIPS.BALANCED,
        instructions: [
          "Brace your core before every rep.",
          "Keep knees tracking in line with your toes.",
          "Add load only when your form is stable.",
        ],
        benefits: ["Builds glutes and legs", "Improves lifting strength", "Supports calorie use"],
      },
      {
        id: "mg-full-body-hypertrophy",
        name: "Full Body Hypertrophy",
        workoutType: "STRENGTH",
        description: "Compound movements built for muscle growth.",
        durationMinutes: 45,
        calories: 360,
        difficulty: "Hard",
        videoUrl: VIDEO_CLIPS.BEGINNER,
        instructions: [
          "Aim for slow, clean reps with full range of motion.",
          "Choose 3 to 4 sets per exercise.",
          "Keep rest periods consistent and controlled.",
        ],
        benefits: ["Stimulates growth", "Trains multiple muscle groups", "Improves total-body strength"],
      },
    ],
  },
  MAINTAIN_WEIGHT: {
    key: "MAINTAIN_WEIGHT",
    label: "Maintain Weight",
    subtitle: "Balanced sessions that keep your routine active without overdoing it.",
    accent: "#00e5a0",
    focus: "Stay fit, stay consistent, and keep your energy levels steady.",
    routines: [
      {
        id: "mw-balanced-circuit",
        name: "Balanced Circuit",
        workoutType: "BALANCED",
        description: "A mix of strength and cardio for steady maintenance.",
        durationMinutes: 25,
        calories: 240,
        difficulty: "Medium",
        videoUrl: VIDEO_CLIPS.BALANCED,
        instructions: [
          "Move smoothly between exercises with short breaks.",
          "Keep your form clean over speed.",
          "Stay at a pace you can repeat consistently.",
        ],
        benefits: ["Maintains fitness", "Supports consistency", "Keeps workouts varied"],
      },
      {
        id: "mw-cycling-flow",
        name: "Cycling Flow",
        workoutType: "CARDIO",
        description: "Low-impact cycling for endurance and calorie balance.",
        durationMinutes: 30,
        calories: 300,
        difficulty: "Medium",
        videoUrl: VIDEO_CLIPS.CARDIO,
        instructions: [
          "Start with a light resistance warm-up.",
          "Add resistance in small increments.",
          "Keep breathing steady through the middle of the ride.",
        ],
        benefits: ["Gentle on joints", "Improves endurance", "Keeps metabolism active"],
      },
      {
        id: "mw-core-recovery",
        name: "Core Recovery",
        workoutType: "MOBILITY",
        description: "Core and mobility work for balanced recovery days.",
        durationMinutes: 18,
        calories: 150,
        difficulty: "Easy",
        videoUrl: VIDEO_CLIPS.MOBILITY,
        instructions: [
          "Engage your core throughout each hold.",
          "Move slowly and stay in control.",
          "Use the final minutes to stretch and reset.",
        ],
        benefits: ["Improves stability", "Supports recovery", "Helps posture"],
      },
    ],
  },
  IMPROVE_FITNESS: {
    key: "IMPROVE_FITNESS",
    label: "Improve Fitness",
    subtitle: "General fitness work for strength, mobility, and cardio balance.",
    accent: "#0099ff",
    focus: "Build a solid base with flexible workouts you can keep progressing.",
    routines: [
      {
        id: "if-mobility-flow",
        name: "Mobility Flow",
        workoutType: "MOBILITY",
        description: "Joint-friendly movement for flexibility and control.",
        durationMinutes: 20,
        calories: 120,
        difficulty: "Easy",
        videoUrl: VIDEO_CLIPS.MOBILITY,
        instructions: [
          "Ease into each movement and breathe deeply.",
          "Do not force range of motion.",
          "Hold each position long enough to feel the stretch.",
        ],
        benefits: ["Improves flexibility", "Helps recovery", "Prepares you for harder sessions"],
      },
      {
        id: "if-beginner-cardio",
        name: "Beginner Cardio",
        workoutType: "CARDIO",
        description: "A simple conditioning session for overall fitness.",
        durationMinutes: 25,
        calories: 220,
        difficulty: "Easy",
        videoUrl: VIDEO_CLIPS.BEGINNER,
        instructions: [
          "Keep the intensity moderate and sustainable.",
          "Focus on consistency rather than speed.",
          "Use the last 5 minutes for a controlled cool down.",
        ],
        benefits: ["Builds endurance", "Good for daily movement", "Easy to repeat"],
      },
      {
        id: "if-low-impact-strength",
        name: "Low Impact Strength",
        workoutType: "LOW_IMPACT",
        description: "Gentle strength work that keeps the whole body active.",
        durationMinutes: 30,
        calories: 200,
        difficulty: "Medium",
        videoUrl: VIDEO_CLIPS.LOW_IMPACT,
        instructions: [
          "Use controlled reps and avoid rushing.",
          "Focus on tension and quality movement.",
          "Take extra rest if your form slips.",
        ],
        benefits: ["Builds strength safely", "Less joint stress", "Good for regular training"],
      },
    ],
  },
};

export const WORKOUT_GOAL_KEYS = Object.keys(WORKOUT_PLANS);

const GOAL_ALIASES = {
  FAT_LOSS: "WEIGHT_LOSS",
  CUTTING: "WEIGHT_LOSS",
  LOSE_WEIGHT: "WEIGHT_LOSS",
  MUSCLE_BUILD: "MUSCLE_GAIN",
  BULK: "MUSCLE_GAIN",
  TONING: "IMPROVE_FITNESS",
  FITNESS: "IMPROVE_FITNESS",
  RECOMP: "MAINTAIN_WEIGHT",
  BALANCE: "MAINTAIN_WEIGHT",
};

const ACTIVITY_RANK = {
  SEDENTARY: 0,
  LIGHTLY_ACTIVE: 1,
  MODERATELY_ACTIVE: 2,
  VERY_ACTIVE: 3,
  EXTRA_ACTIVE: 4,
};

export const normalizeFitnessGoal = (value) => {
  const key = String(value || "").trim().toUpperCase().replace(/\s+/g, "_");
  return WORKOUT_PLANS[key] ? key : GOAL_ALIASES[key] || "IMPROVE_FITNESS";
};

export const getWorkoutPlan = (goal) => WORKOUT_PLANS[normalizeFitnessGoal(goal)] || WORKOUT_PLANS.IMPROVE_FITNESS;

export const getWorkoutRoutine = (goal, routineId) => {
  const plan = getWorkoutPlan(goal);
  return plan.routines.find((routine) => routine.id === routineId) || plan.routines[0];
};

export const getRecommendedWorkout = (goal, activityLevel) => {
  const plan = getWorkoutPlan(goal);
  const rank = ACTIVITY_RANK[String(activityLevel || "").toUpperCase()] ?? 2;
  const index = Math.min(plan.routines.length - 1, Math.max(0, rank - 1));
  return plan.routines[index] || plan.routines[0];
};

export const getRandomWorkout = (goal = "IMPROVE_FITNESS") => {
  const plan = getWorkoutPlan(goal);
  return plan.routines[Math.floor(Math.random() * plan.routines.length)] || plan.routines[0];
};

export const getDailyWorkout = (goal = "IMPROVE_FITNESS", activityLevel) => {
  const hour = new Date().getHours();
  const plan = getWorkoutPlan(goal);
  const workout = getRecommendedWorkout(goal, activityLevel);

  if (hour >= 5 && hour < 9) {
    return { suggestedTime: "Morning", workout, motivation: "Start the day with a clean session." };
  }
  if (hour >= 16 && hour < 19) {
    return { suggestedTime: "Evening", workout, motivation: "Finish strong and stay consistent." };
  }
  return {
    suggestedTime: "Anytime",
    workout: workout || plan.routines[0],
    motivation: "Any completed session is progress.",
  };
};

export const workoutPrograms = WORKOUT_PLANS;

