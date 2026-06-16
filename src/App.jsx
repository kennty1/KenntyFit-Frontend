import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  ActivityIndicator,
  Alert,
  FlatList,
  Dimensions,
} from 'react-native';
import { styles } from './styles';

// ==================== Contexts ====================

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const login = async (email, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email && password) {
          setUser({ id: '1', email, name: 'John Doe', subscriptionTier: 'free' });
          resolve(true);
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 1000);
    });
  };

  const logout = () => setUser(null);
  const updateSubscription = (tier) => setUser(prev => ({ ...prev, subscriptionTier: tier }));

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateSubscription }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// ==================== Guards ====================

const SubscriptionGuard = ({ children, requiredTier = 'free' }) => {
  const { user } = useAuth();
  const tiers = { free: 0, premium: 1, pro: 2 };
  if (!user || tiers[user.subscriptionTier] < tiers[requiredTier]) {
    return (
      <View style={styles.upgradeContainer}>
        <Text style={styles.upgradeTitle}>Upgrade Required</Text>
        <Text style={styles.upgradeText}>This feature requires {requiredTier} subscription.</Text>
        <TouchableOpacity style={styles.upgradeButton}>
          <Text style={styles.upgradeButtonText}>View Plans</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return children;
};

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return <ActivityIndicator size="large" color="#00e5a0" style={styles.loadingContainer} />;
  if (!user) {
    return (
      <View style={styles.loginPromptContainer}>
        <Text style={styles.loginPromptText}>Please log in to continue</Text>
        <TouchableOpacity style={styles.loginPromptButton}>
          <Text style={styles.loginPromptButtonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (adminOnly && user.email !== 'admin@example.com') {
    return (
      <View style={styles.loginPromptContainer}>
        <Text style={styles.loginPromptText}>Admin access required</Text>
      </View>
    );
  }
  return children;
};

// ==================== Components ====================

const Navbar = ({ navigation, currentRoute }) => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const { user, logout } = useAuth();

  const menuItems = [
    { key: 'dashboard', label: 'Dashboard', icon: '📊', route: 'Dashboard' },
    { key: 'meals', label: 'Meals', icon: '🍽️', route: 'Meals' },
    { key: 'meal-suggestions', label: 'Suggestions', icon: '💡', route: 'MealSuggestions' },
    { key: 'workouts', label: 'Workouts', icon: '💪', route: 'Workouts' },
    { key: 'water', label: 'Water', icon: '💧', route: 'Water' },
    { key: 'progress', label: 'Progress', icon: '📈', route: 'Progress' },
    { key: 'scanner', label: 'Scanner', icon: '📷', route: 'FoodScanner' },
    { key: 'profile', label: 'Profile', icon: '👤', route: 'Profile' },
    { key: 'settings', label: 'Settings', icon: '⚙️', route: 'Settings' },
  ];

  if (user?.email === 'admin@example.com') {
    menuItems.push({ key: 'users', label: 'Users', icon: '👥', route: 'Users' });
  }

  const navigateTo = (route) => {
    setDrawerVisible(false);
    navigation(route);
  };

  return (
    <>
      <SafeAreaView style={styles.navbarSafeArea}>
        <View style={styles.navbar}>
          <TouchableOpacity style={styles.menuButton} onPress={() => setDrawerVisible(true)}>
            <View style={styles.menuBar} />
            <View style={styles.menuBar} />
            <View style={styles.menuBar} />
          </TouchableOpacity>

          <View style={styles.brand}>
            <View style={styles.brandIcon}>
              <Text style={styles.brandIconText}>💪</Text>
            </View>
            <View>
              <Text style={styles.brandName}>FitTrack</Text>
              <Text style={styles.brandSub}>Your fitness journey</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.navScroll}>
          {menuItems.map(item => (
            <TouchableOpacity
              key={item.key}
              style={[styles.navLink, currentRoute === item.route && styles.navLinkActive]}
              onPress={() => navigation(item.route)}
            >
              <Text style={styles.navIcon}>{item.icon}</Text>
              <Text style={[styles.navLabel, currentRoute === item.route && styles.navLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>

      <Modal visible={drawerVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.drawerBackdrop} activeOpacity={1} onPress={() => setDrawerVisible(false)}>
          <View style={styles.drawer}>
            <View style={styles.drawerHeader}>
              <View>
                <Text style={styles.drawerTitle}>FitTrack</Text>
                <Text style={styles.drawerSubtitle}>{user?.email || 'Guest'}</Text>
              </View>
              <TouchableOpacity style={styles.drawerClose} onPress={() => setDrawerVisible(false)}>
                <Text style={styles.drawerCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={menuItems}
              keyExtractor={item => item.key}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.drawerLink, currentRoute === item.route && styles.drawerLinkActive]}
                  onPress={() => navigateTo(item.route)}
                >
                  <Text style={styles.drawerIcon}>{item.icon}</Text>
                  <Text style={[styles.drawerLabel, currentRoute === item.route && styles.drawerLabelActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity style={styles.drawerLogout} onPress={() => { logout(); setDrawerVisible(false); }}>
              <Text style={styles.drawerLogoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>{children}</View>
);

const Button = ({ title, onPress, variant = 'primary', disabled, style, icon }) => (
  <TouchableOpacity
    style={[
      styles.button,
      variant === 'primary' && styles.buttonPrimary,
      variant === 'danger' && styles.buttonDanger,
      variant === 'ghost' && styles.buttonGhost,
      disabled && styles.buttonDisabled,
      style,
    ]}
    onPress={onPress}
    disabled={disabled}
  >
    {icon && <Text style={styles.buttonIcon}>{icon}</Text>}
    <Text style={[styles.buttonText, variant === 'ghost' && styles.buttonGhostText]}>
      {title}
    </Text>
  </TouchableOpacity>
);

const Input = ({ label, value, onChangeText, placeholder, secureTextEntry, style, keyboardType }) => (
  <View style={[styles.inputContainer, style]}>
    {label && <Text style={styles.inputLabel}>{label}</Text>}
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#6b7fa3"
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
    />
  </View>
);

const Badge = ({ text, variant = 'green' }) => (
  <View style={[styles.badge, styles[`badge${variant.charAt(0).toUpperCase() + variant.slice(1)}`]]}>
    <Text style={styles.badgeText}>{text}</Text>
  </View>
);

const AlertMessage = ({ message, type = 'error', onDismiss }) => {
  if (!message) return null;
  return (
    <View style={[styles.alert, type === 'error' ? styles.alertError : styles.alertSuccess]}>
      <Text style={[styles.alertText, type === 'error' ? styles.alertErrorText : styles.alertSuccessText]}>
        {message}
      </Text>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss}>
          <Text style={styles.alertClose}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ==================== Pages ====================

const Welcome = ({ navigation }) => {
  const stats = [
    { label: 'Active Users', value: '10K+' },
    { label: 'Meals Logged', value: '1M+' },
    { label: 'Workouts', value: '50K+' },
    { label: 'Countries', value: '120+' },
  ];

  return (
    <ScrollView style={styles.welcomeContainer} contentContainerStyle={styles.welcomeContent}>
      <View style={styles.welcomeShell}>
        <View style={styles.welcomeCopy}>
          <View style={styles.welcomeBrand}>
            <View style={styles.welcomeBrandIcon}>
              <Text style={styles.welcomeBrandIconText}>💪</Text>
            </View>
            <View>
              <Text style={styles.welcomeBrandEyebrow}>Fitness Tracker</Text>
              <Text style={styles.welcomeBrandName}>FitTrack</Text>
            </View>
          </View>

          <Text style={styles.welcomeTitle}>Your journey to a healthier you starts here</Text>
          <Text style={styles.welcomeSubtitle}>
            Track meals, workouts, water intake, and monitor your progress all in one place.
          </Text>

          <View style={styles.welcomeActions}>
            <Button title="Get Started" variant="primary" onPress={() => navigation('Login')} />
            <Button title="View Pricing" variant="ghost" onPress={() => navigation('Pricing')} />
          </View>

          <View style={styles.welcomeStatsGrid}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.welcomeStat}>
                <Text style={styles.welcomeStatLabel}>{stat.label}</Text>
                <Text style={styles.welcomeStatValue}>{stat.value}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.welcomePhone}>
          <View style={styles.welcomePhoneStatus}>
            <Text>9:41</Text>
            <Text>📶 🔋</Text>
          </View>
          <View style={styles.welcomePhoneHero}>
            <Text style={styles.welcomePhoneEyebrow}>TODAY'S SUMMARY</Text>
            <Text style={styles.welcomePhoneTitle}>1,850</Text>
            <Text style={styles.welcomePhoneText}>calories remaining</Text>
          </View>
          <View style={styles.welcomePhoneTiles}>
            <View style={styles.welcomePhoneTile}>
              <Text style={styles.welcomePhoneTileLabel}>PROTEIN</Text>
              <Text style={styles.welcomePhoneTileValue}>85g / 150g</Text>
            </View>
            <View style={styles.welcomePhoneTile}>
              <Text style={styles.welcomePhoneTileLabel}>WATER</Text>
              <Text style={styles.welcomePhoneTileValue}>4 / 8 cups</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const Login = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigation('Dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
      <Card style={styles.loginCard}>
        <Text style={styles.loginTitle}>Welcome Back</Text>
        <Text style={styles.loginSubtitle}>Sign in to continue your fitness journey</Text>
        <AlertMessage message={error} type="error" onDismiss={() => setError('')} />
        <Input label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" />
        <Input label="Password" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />
        <Button title={loading ? 'Signing in...' : 'Sign In'} onPress={handleLogin} disabled={loading} />
        <TouchableOpacity onPress={() => navigation('Pricing')}>
          <Text style={styles.loginLink}>Don't have an account? Sign up</Text>
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );
};

const Dashboard = ({ navigation }) => {
  const { user } = useAuth();
  const stats = [
    { label: 'Calories', value: '1,250 / 2,200', progress: 0.57 },
    { label: 'Water', value: '3 / 8 cups', progress: 0.375 },
  ];

  return (
    <ScrollView style={styles.page}>
      <Text style={styles.pageTitle}>Dashboard</Text>
      <Text style={styles.pageSub}>Welcome back, {user?.name || 'User'}!</Text>

      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <Card key={index} style={styles.statCard}>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${stat.progress * 100}%` }]} />
            </View>
          </Card>
        ))}
      </View>

      <TouchableOpacity style={styles.logWaterCard} onPress={() => navigation('Water')}>
        <Text style={styles.logWaterText}>💧 Hydration</Text>
        <Text style={styles.logWaterSubtext}>Auto-recorded from motion</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const Meals = () => {
  const [meals, setMeals] = useState([
    { id: '1', name: 'Breakfast - Oatmeal', calories: 350, date: '2024-01-15' },
    { id: '2', name: 'Lunch - Chicken Rice', calories: 550, date: '2024-01-15' },
  ]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newMeal, setNewMeal] = useState({ name: '', calories: '' });

  const addMeal = () => {
    if (newMeal.name && newMeal.calories) {
      setMeals([{
        id: Date.now().toString(),
        ...newMeal,
        calories: parseInt(newMeal.calories),
        date: new Date().toISOString().split('T')[0],
      }, ...meals]);
      setNewMeal({ name: '', calories: '' });
      setModalVisible(false);
    }
  };

  const deleteMeal = (id) => {
    Alert.alert('Delete Meal', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setMeals(meals.filter(m => m.id !== id)) },
    ]);
  };

  return (
    <View style={styles.page}>
      <View style={styles.headerRow}>
        <Text style={styles.pageTitle}>Meals</Text>
        <Button title="+ Add Meal" variant="primary" onPress={() => setModalVisible(true)} />
      </View>

      <FlatList
        data={meals}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Card style={styles.mealListItem}>
            <View style={styles.mealListContent}>
              <View style={{ flex: 1 }}>
                <Text style={styles.mealListName}>{item.name}</Text>
                <Text style={styles.mealListMacros}>{item.calories} cal</Text>
              </View>
              <TouchableOpacity onPress={() => deleteMeal(item.id)}>
                <Text style={styles.deleteButtonText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}
      />

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add Meal</Text>
            <Input label="Meal Name" value={newMeal.name} onChangeText={text => setNewMeal({ ...newMeal, name: text })} />
            <Input label="Calories" value={newMeal.calories} onChangeText={text => setNewMeal({ ...newMeal, calories: text })} keyboardType="numeric" />
            <View style={styles.modalButtons}>
              <Button title="Cancel" variant="ghost" onPress={() => setModalVisible(false)} />
              <Button title="Add Meal" variant="primary" onPress={addMeal} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const MealSuggestions = () => {
  const suggestions = [
    { id: '1', name: 'Greek Yogurt Bowl', calories: 320, protein: 24, prepTime: '5 min', image: '🥣' },
    { id: '2', name: 'Quinoa Salad', calories: 420, protein: 15, prepTime: '15 min', image: '🥗' },
  ];

  return (
    <ScrollView style={styles.page}>
      <Text style={styles.pageTitle}>Meal Suggestions</Text>
      <Text style={styles.pageSub}>AI-powered recommendations</Text>
      {suggestions.map(suggestion => (
        <Card key={suggestion.id} style={styles.suggestionCard}>
          <Text style={styles.suggestionImage}>{suggestion.image}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.suggestionName}>{suggestion.name}</Text>
            <Text style={styles.suggestionDetails}>{suggestion.calories} cal • {suggestion.protein}g protein</Text>
          </View>
          <Button title="Log" variant="primary" size="small" />
        </Card>
      ))}
    </ScrollView>
  );
};

const Workouts = () => {
  const [workouts, setWorkouts] = useState([
    { id: '1', name: 'Morning Run', duration: 30, calories: 280, type: 'cardio', completed: false },
  ]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newWorkout, setNewWorkout] = useState({ name: '', duration: '', type: 'cardio' });

  const addWorkout = () => {
    if (newWorkout.name && newWorkout.duration) {
      setWorkouts([{
        id: Date.now().toString(),
        ...newWorkout,
        duration: parseInt(newWorkout.duration),
        completed: false,
      }, ...workouts]);
      setNewWorkout({ name: '', duration: '', type: 'cardio' });
      setModalVisible(false);
    }
  };

  const toggleComplete = (id) => {
    setWorkouts(workouts.map(w => w.id === id ? { ...w, completed: !w.completed } : w));
  };

  return (
    <View style={styles.page}>
      <View style={styles.headerRow}>
        <Text style={styles.pageTitle}>Workouts</Text>
        <Button title="+ Add Workout" variant="primary" onPress={() => setModalVisible(true)} />
      </View>

      <FlatList
        data={workouts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Card style={[styles.workoutListItem, item.completed && styles.workoutCompleted]}>
            <TouchableOpacity onPress={() => toggleComplete(item.id)}>
              <Text>{item.completed ? '✅' : '◻️'}</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[styles.workoutListName, item.completed && styles.textStrikethrough]}>
                {item.name}
              </Text>
              <Text style={styles.workoutListDetails}>{item.duration} min • {item.calories || 0} cal</Text>
            </View>
            <Badge text={item.type} variant="green" />
          </Card>
        )}
      />

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add Workout</Text>
            <Input label="Workout Name" value={newWorkout.name} onChangeText={text => setNewWorkout({ ...newWorkout, name: text })} />
            <Input label="Duration (minutes)" value={newWorkout.duration} onChangeText={text => setNewWorkout({ ...newWorkout, duration: text })} keyboardType="numeric" />
            <View style={styles.modalButtons}>
              <Button title="Cancel" variant="ghost" onPress={() => setModalVisible(false)} />
              <Button title="Add Workout" variant="primary" onPress={addWorkout} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const Water = () => {
  const [waterIntake, setWaterIntake] = useState(0);
  const dailyGoal = 8;

  const addWater = () => setWaterIntake(prev => Math.min(prev + 1, dailyGoal));
  const resetWater = () => {
    Alert.alert('Reset Water Intake', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', onPress: () => setWaterIntake(0) },
    ]);
  };

  const progress = waterIntake / dailyGoal;

  return (
    <ScrollView style={styles.page}>
      <Text style={styles.pageTitle}>Water Tracker</Text>
      <Card style={styles.waterCard}>
        <Text style={styles.waterGoal}>{waterIntake} / {dailyGoal} cups</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: '#0099ff' }]} />
        </View>
        <View style={styles.waterButtons}>
          <Button title="+ 1 cup" variant="primary" onPress={addWater} />
          <Button title="Reset" variant="danger" onPress={resetWater} />
        </View>
      </Card>
    </ScrollView>
  );
};

const Progress = () => {
  const weeklyData = [
    { day: 'Mon', calories: 2100, goal: 2200 },
    { day: 'Tue', calories: 1950, goal: 2200 },
    { day: 'Wed', calories: 2250, goal: 2200 },
  ];
  const maxCalories = 2500;

  return (
    <ScrollView style={styles.page}>
      <Text style={styles.pageTitle}>Progress</Text>
      <Card style={styles.chartCard}>
        <Text style={styles.chartTitle}>Daily Calories</Text>
        <View style={styles.chart}>
          {weeklyData.map((data, index) => (
            <View key={index} style={styles.chartBar}>
              <View style={styles.chartBarContainer}>
                <View style={[styles.chartBarFill, { height: `${(data.calories / maxCalories) * 100}%` }]} />
              </View>
              <Text style={styles.chartLabel}>{data.day}</Text>
            </View>
          ))}
        </View>
      </Card>
    </ScrollView>
  );
};

const FoodScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setResult({ name: 'Apple', calories: 95, protein: 0.5, carbs: 25, fat: 0.3 });
    }, 2000);
  };

  return (
    <ScrollView style={styles.page}>
      <Text style={styles.pageTitle}>Food Scanner</Text>
      <TouchableOpacity style={styles.scannerButton} onPress={handleScan} disabled={scanning}>
        <Text style={styles.scannerIcon}>📷</Text>
        <Text style={styles.scannerText}>{scanning ? 'Scanning...' : 'Start Scanning'}</Text>
      </TouchableOpacity>
      {result && (
        <Card style={styles.scanResult}>
          <Text style={styles.scanResultTitle}>{result.name}</Text>
          <Text style={styles.scanResultServing}>{result.calories} calories</Text>
          <Button title="Log This Food" variant="primary" />
        </Card>
      )}
    </ScrollView>
  );
};

const Profile = () => {
  const { user } = useAuth();
  return (
    <ScrollView style={styles.page}>
      <View style={styles.profileHeader}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>👤</Text>
        </View>
        <Text style={styles.profileName}>{user?.name || 'User'}</Text>
        <Text style={styles.profileEmail}>{user?.email}</Text>
        <Badge text={user?.subscriptionTier || 'Free'} variant="green" />
      </View>
    </ScrollView>
  );
};

const Settings = () => {
  return (
    <ScrollView style={styles.page}>
      <Text style={styles.pageTitle}>Settings</Text>
      <Button title="Export Data" variant="ghost" />
      <Button title="Delete Account" variant="danger" style={styles.dangerButton} />
    </ScrollView>
  );
};

const Users = () => {
  const users = [
    { id: '1', name: 'John Doe', email: 'john@example.com', subscription: 'premium' },
  ];
  return (
    <ScrollView style={styles.page}>
      <Text style={styles.pageTitle}>User Management</Text>
      <Text style={styles.pageSub}>Admin only</Text>
      {users.map(user => (
        <Card key={user.id} style={styles.userCard}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Badge text={user.subscription} variant="green" />
        </Card>
      ))}
    </ScrollView>
  );
};

const Pricing = ({ navigation }) => {
  const plans = [
    { tier: 'Free', price: '$0', features: ['Basic meal tracking'], cta: 'Current Plan' },
    { tier: 'Premium', price: '$9.99', period: '/month', features: ['AI meal suggestions', 'Food scanner'], cta: 'Upgrade' },
  ];

  return (
    <ScrollView style={styles.page}>
      <Text style={styles.pageTitle}>Pricing Plans</Text>
      {plans.map(plan => (
        <Card key={plan.tier} style={styles.pricingCard}>
          <Text style={styles.pricingTier}>{plan.tier}</Text>
          <Text style={styles.pricingPrice}>{plan.price}{plan.period}</Text>
          {plan.features.map((feature, i) => (
            <Text key={i} style={styles.pricingFeature}>✓ {feature}</Text>
          ))}
          <Button title={plan.cta} variant={plan.tier === 'Free' ? 'ghost' : 'primary'} onPress={() => plan.tier !== 'Free' && navigation('Payment')} />
        </Card>
      ))}
    </ScrollView>
  );
};

const Payment = ({ navigation }) => {
  const [cardNumber, setCardNumber] = useState('');
  const [processing, setProcessing] = useState(false);

  const handlePayment = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      navigation('PaymentSuccess');
    }, 2000);
  };

  return (
    <ScrollView style={styles.page}>
      <Text style={styles.pageTitle}>Payment</Text>
      <Card>
        <Input label="Card Number" value={cardNumber} onChangeText={setCardNumber} placeholder="1234 5678 9012 3456" keyboardType="numeric" />
        <Button title={processing ? 'Processing...' : 'Pay $9.99'} onPress={handlePayment} disabled={processing} />
      </Card>
    </ScrollView>
  );
};

const PaymentSuccess = ({ navigation }) => {
  useEffect(() => {
    setTimeout(() => navigation('Dashboard'), 3000);
  }, []);
  return (
    <View style={styles.successContainer}>
      <Text style={styles.successIcon}>🎉</Text>
      <Text style={styles.successTitle}>Payment Successful!</Text>
    </View>
  );
};

// ==================== Main App ====================

const App = () => {
  const [currentScreen, setCurrentScreen] = useState('Welcome');
  const { user } = useAuth();

  const navigate = (screen) => setCurrentScreen(screen);

  const screens = {
    Welcome: <Welcome navigation={navigate} />,
    Login: <Login navigation={navigate} />,
    Dashboard: <Dashboard navigation={navigate} />,
    Meals: <Meals navigation={navigate} />,
    MealSuggestions: <MealSuggestions navigation={navigate} />,
    Workouts: <Workouts navigation={navigate} />,
    Water: <Water navigation={navigate} />,
    Progress: <Progress navigation={navigate} />,
    FoodScanner: <FoodScanner navigation={navigate} />,
    Profile: <Profile navigation={navigate} />,
    Settings: <Settings navigation={navigate} />,
    Users: <Users navigation={navigate} />,
    Pricing: <Pricing navigation={navigate} />,
    Payment: <Payment navigation={navigate} />,
    PaymentSuccess: <PaymentSuccess navigation={navigate} />,
  };

  const showNavbar = user && !['Welcome', 'Login', 'Payment', 'PaymentSuccess'].includes(currentScreen);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0e1a" />
      {showNavbar && <Navbar navigation={navigate} currentRoute={currentScreen} />}
      {screens[currentScreen] || screens.Welcome}
    </SafeAreaView>
  );
};

const AppWrapper = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

export default AppWrapper;
