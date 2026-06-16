import { StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export const styles = StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: '#0a0e1a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Navbar
  navbarSafeArea: {
    backgroundColor: 'rgba(22, 29, 46, 0.96)',
    borderBottomWidth: 1,
    borderBottomColor: '#1e2d45',
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e2d45',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuBar: {
    width: 18,
    height: 2,
    borderRadius: 999,
    backgroundColor: '#f0f4ff',
    marginVertical: 2,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#0b1220',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandIconText: {
    fontSize: 20,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f0f4ff',
  },
  brandSub: {
    fontSize: 12,
    color: '#6b7fa3',
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
  },
  logoutButtonText: {
    fontSize: 12,
    color: '#ff6b6b',
    fontWeight: '600',
  },
  navScroll: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  navLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1e2d45',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    marginRight: 8,
  },
  navLinkActive: {
    borderColor: 'rgba(0, 229, 160, 0.45)',
    backgroundColor: 'rgba(0, 229, 160, 0.08)',
  },
  navIcon: {
    fontSize: 15,
  },
  navLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7fa3',
  },
  navLabelActive: {
    color: '#00e5a0',
  },

  // Drawer
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.55)',
    justifyContent: 'flex-end',
  },
  drawer: {
    width: screenWidth * 0.88,
    maxWidth: 320,
    height: '100%',
    backgroundColor: '#161d2e',
    borderLeftWidth: 1,
    borderLeftColor: '#1e2d45',
    padding: 18,
    alignSelf: 'flex-end',
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f0f4ff',
  },
  drawerSubtitle: {
    fontSize: 12,
    color: '#6b7fa3',
    marginTop: 4,
  },
  drawerClose: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e2d45',
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerCloseText: {
    fontSize: 22,
    color: '#f0f4ff',
  },
  drawerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e2d45',
    backgroundColor: '#111827',
    marginBottom: 10,
  },
  drawerLinkActive: {
    borderColor: 'rgba(0, 229, 160, 0.45)',
    backgroundColor: 'rgba(0, 229, 160, 0.08)',
  },
  drawerIcon: {
    fontSize: 18,
  },
  drawerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f0f4ff',
  },
  drawerLabelActive: {
    color: '#00e5a0',
  },
  drawerLogout: {
    marginTop: 'auto',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    alignItems: 'center',
  },
  drawerLogoutText: {
    color: '#ff6b6b',
    fontWeight: '600',
  },

  // Card
  card: {
    backgroundColor: '#161d2e',
    borderWidth: 1,
    borderColor: '#1e2d45',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
  },

  // Button
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  buttonPrimary: {
    backgroundColor: '#00e5a0',
  },
  buttonDanger: {
    backgroundColor: '#ff6b6b',
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#1e2d45',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0a0e1a',
  },
  buttonGhostText: {
    color: '#6b7fa3',
  },
  buttonIcon: {
    fontSize: 14,
  },

  // Input
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7fa3',
    textTransform: 'uppercase',
    letterSpacing: 0.08,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1e2d45',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    color: '#f0f4ff',
    fontSize: 14,
  },

  // Badge
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  badgeGreen: {
    backgroundColor: 'rgba(0, 229, 160, 0.15)',
  },
  badgeBlue: {
    backgroundColor: 'rgba(0, 153, 255, 0.15)',
  },
  badgeRed: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#00e5a0',
  },

  // Alert
  alert: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertError: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  alertSuccess: {
    backgroundColor: 'rgba(0, 229, 160, 0.1)',
    borderWidth: 1,
    borderColor: '#00e5a0',
  },
  alertText: {
    fontSize: 14,
    flex: 1,
  },
  alertErrorText: {
    color: '#ff6b6b',
  },
  alertSuccessText: {
    color: '#00e5a0',
  },
  alertClose: {
    fontSize: 16,
    color: '#6b7fa3',
    marginLeft: 12,
  },

  // Upgrade Required
  upgradeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  upgradeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f0f4ff',
    marginBottom: 8,
  },
  upgradeText: {
    fontSize: 14,
    color: '#6b7fa3',
    marginBottom: 20,
    textAlign: 'center',
  },
  upgradeButton: {
    backgroundColor: '#00e5a0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  upgradeButtonText: {
    fontWeight: '600',
    color: '#0a0e1a',
  },

  // Login Prompt
  loginPromptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loginPromptText: {
    fontSize: 16,
    color: '#6b7fa3',
    marginBottom: 20,
  },
  loginPromptButton: {
    backgroundColor: '#00e5a0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  loginPromptButtonText: {
    fontWeight: '600',
    color: '#0a0e1a',
  },

  // Pages
  page: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  pageContent: {
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f0f4ff',
    letterSpacing: -0.02,
    marginBottom: 4,
  },
  pageSub: {
    fontSize: 14,
    color: '#6b7fa3',
    marginBottom: 24,
  },

  // Welcome Page
  welcomeContainer: {
    flex: 1,
    backgroundColor: '#0a0e1a',
  },
  welcomeContent: {
    padding: 20,
  },
  welcomeShell: {
    maxWidth: 1120,
    alignSelf: 'center',
    width: '100%',
  },
  welcomeCopy: {
    marginBottom: 24,
  },
  welcomeBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  welcomeBrandIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#0b1220',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeBrandIconText: {
    fontSize: 24,
  },
  welcomeBrandEyebrow: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.08,
    color: '#6b7fa3',
  },
  welcomeBrandName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f0f4ff',
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
    color: '#f0f4ff',
    marginBottom: 16,
  },
  welcomeSubtitle: {
    fontSize: 15,
    lineHeight: 24,
    color: '#6b7fa3',
    marginBottom: 24,
  },
  welcomeActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  welcomeStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  welcomeStat: {
    flex: 1,
    minWidth: '22%',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#1e2d45',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  welcomeStatLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.08,
    color: '#6b7fa3',
    marginBottom: 6,
  },
  welcomeStatValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f0f4ff',
  },
  welcomePhone: {
    backgroundColor: '#05070d',
    borderRadius: 36,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 20,
  },
  welcomePhoneStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 6,
  },
  welcomePhoneHero: {
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  welcomePhoneEyebrow: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.08,
    color: '#6b7fa3',
    marginBottom: 6,
  },
  welcomePhoneTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f0f4ff',
    marginBottom: 8,
  },
  welcomePhoneText: {
    fontSize: 13,
    color: '#6b7fa3',
  },
  welcomePhoneTiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 8,
    marginVertical: 12,
  },
  welcomePhoneTile: {
    width: '47%',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  welcomePhoneTileLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.08,
    color: '#6b7fa3',
    marginBottom: 6,
  },
  welcomePhoneTileValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f0f4ff',
  },

  // Login Page
  loginCard: {
    padding: 24,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f0f4ff',
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 14,
    color: '#6b7fa3',
    marginBottom: 24,
  },
  loginLink: {
    textAlign: 'center',
    marginTop: 16,
    color: '#00e5a0',
  },

  // Dashboard
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
  },
  statLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.08,
    color: '#6b7fa3',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f0f4ff',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#1e2d45',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00e5a0',
    borderRadius: 3,
  },
  logWaterCard: {
    backgroundColor: 'rgba(0, 153, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#0099ff',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginTop: 16,
  },
  logWaterText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0099ff',
  },
  logWaterSubtext: {
    fontSize: 12,
    color: '#6b7fa3',
    marginTop: 4,
  },

  // Meals
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mealListItem: {
    marginBottom: 8,
  },
  mealListContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealListName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#f0f4ff',
    marginBottom: 4,
  },
  mealListMacros: {
    fontSize: 12,
    color: '#6b7fa3',
  },
  deleteButtonText: {
    fontSize: 18,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#161d2e',
    borderWidth: 1,
    borderColor: '#1e2d45',
    borderRadius: 18,
    padding: 24,
    width: '100%',
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f0f4ff',
    marginBottom: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },

  // Suggestions
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  suggestionImage: {
    fontSize: 40,
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f0f4ff',
  },
  suggestionDetails: {
    fontSize: 12,
    color: '#6b7fa3',
    marginTop: 2,
  },

  // Workouts
  workoutListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  workoutCompleted: {
    opacity: 0.6,
  },
  workoutListName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#f0f4ff',
  },
  workoutListDetails: {
    fontSize: 12,
    color: '#6b7fa3',
    marginTop: 2,
  },
  textStrikethrough: {
    textDecorationLine: 'line-through',
  },

  // Water
  waterCard: {
    alignItems: 'center',
  },
  waterGoal: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f0f4ff',
    marginBottom: 16,
  },
  waterButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },

  // Progress Chart
  chartCard: {
    padding: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f0f4ff',
    marginBottom: 16,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 200,
  },
  chartBar: {
    alignItems: 'center',
    width: 40,
  },
  chartBarContainer: {
    height: 150,
    width: 30,
    backgroundColor: '#1e2d45',
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  chartBarFill: {
    width: '100%',
    backgroundColor: '#00e5a0',
    borderRadius: 8,
  },
  chartLabel: {
    marginTop: 8,
    fontSize: 12,
    color: '#6b7fa3',
  },

  // Scanner
  scannerButton: {
    backgroundColor: 'rgba(0, 229, 160, 0.1)',
    borderWidth: 1,
    borderColor: '#00e5a0',
    borderRadius: 14,
    padding: 40,
    alignItems: 'center',
    marginBottom: 20,
  },
  scannerIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  scannerText: {
    fontSize: 16,
    color: '#00e5a0',
    fontWeight: '600',
  },
  scanResult: {
    marginTop: 20,
  },
  scanResultTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f0f4ff',
    marginBottom: 4,
  },
  scanResultServing: {
    fontSize: 14,
    color: '#6b7fa3',
    marginBottom: 16,
  },

  // Profile
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1c2535',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileAvatarText: {
    fontSize: 40,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f0f4ff',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6b7fa3',
    marginBottom: 8,
  },

  // Pricing
  pricingCard: {
    marginBottom: 16,
  },
  pricingTier: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f0f4ff',
    marginBottom: 8,
  },
  pricingPrice: {
    fontSize: 24,
    fontWeight: '800',
    color: '#00e5a0',
    marginBottom: 16,
  },
  pricingFeature: {
    fontSize: 13,
    color: '#6b7fa3',
    marginBottom: 8,
  },

  // Success
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0e1a',
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f0f4ff',
    marginBottom: 8,
  },

  // User Card
  userCard: {
    marginBottom: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f0f4ff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: '#6b7fa3',
  },

  // Danger Button
  dangerButton: {
    marginTop: 20,
  },

  // Logo — used in Welcome and Login screens
  logo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    marginBottom: 16,
  },
});