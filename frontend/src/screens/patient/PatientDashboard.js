import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import ECGLogo from '../../components/ECGLogo';
import medicationService from '../../services/medicationService';
import prescriptionService from '../../services/prescriptionService';
import vitalsService from '../../services/vitalsService';
import COLORS from '../../utils/colors';
import { SPACING, TYPOGRAPHY, RADIUS, SHADOW } from '../../utils/theme';

const PatientDashboard = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [todayMeds, setTodayMeds] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [adherence, setAdherence] = useState({
    taken: 0,
    missed: 0,
    adherenceRate: 76,
  });
  const [latestVitals, setLatestVitals] = useState(null);
  const [streakDays, setStreakDays] = useState(4);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const patientId = user?.profileId;

  const loadData = async () => {
    if (!patientId) return;
    try {
      const [meds, prescr, adh, vitals] = await Promise.all([
        medicationService.getTodayIntakes(patientId),
        prescriptionService.getActiveByPatient(patientId),
        medicationService.getAdherence(patientId),
        vitalsService.getLatest(patientId).catch(() => null),
      ]);
      setTodayMeds(meds);
      setPrescriptions(prescr);
      setAdherence(adh);
      setLatestVitals(vitals);
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => {
    loadData();
  }, []));

  const handleTake = async (med) => {
    try {
      await medicationService.updateIntakeStatus(med.id, 'TAKEN');
      loadData();
    } catch (err) {
      Alert.alert('Error', 'Could not update status');
    }
  };

  const handleSkip = async (med) => {
    try {
      await medicationService.updateIntakeStatus(med.id, 'SKIPPED');
      loadData();
    } catch (err) {
      Alert.alert('Error', 'Could not update status');
    }
  };

  const pendingCount = todayMeds.filter((m) => m.status === 'PENDING').length;
  const takenToday = todayMeds.filter((m) => m.status === 'TAKEN').length;

  // Group medications by time of day
  const morningMeds = todayMeds.filter(m => {
    const hour = parseInt(m.scheduledTime?.split(':')[0]) || 0;
    return hour >= 5 && hour < 12;
  });
  const eveningMeds = todayMeds.filter(m => {
    const hour = parseInt(m.scheduledTime?.split(':')[0]) || 0;
    return hour >= 17 && hour < 22;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Navigation Bar */}
      <View style={styles.topNav}>
        <View style={styles.navLeft}>
          <ECGLogo size={36} />
          <Text style={styles.navTitle}>MedLink</Text>
        </View>
        <View style={styles.navRight}>
          <TouchableOpacity style={styles.navItem}>
            <Text style={[styles.navItemText, styles.navItemActive]}>Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Schedule')}>
            <Text style={styles.navItemText}>Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Reports')}>
            <Text style={styles.navItemText}>Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Reminders')}>
            <View style={styles.badgeContainer}>
              <Text style={styles.navItemText}>Reminders</Text>
              {pendingCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarBtn} onPress={logout}>
            <View style={styles.navAvatar}>
              <Text style={styles.navAvatarText}>
                {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
          />
        }
      >
        {/* Welcome Card (Hero Section) */}
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeLeft}>
            <View style={styles.welcomeAvatar}>
              <Text style={styles.welcomeAvatarText}>
                {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
              </Text>
            </View>
            <View style={styles.welcomeText}>
              <Text style={styles.welcomeTitle}>Welcome back, {user?.name?.split(' ')[0] || 'Patient'}!</Text>
              <Text style={styles.welcomeSubtitle}>Here's your health overview for today.</Text>
            </View>
          </View>
          <View style={styles.welcomeActions}>
            <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('Vitals')}>
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.trendsBtn} onPress={() => navigation.navigate('History')}>
              <Text style={styles.trendsBtnText}>View Trends</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Content Grid */}
        <View style={styles.mainGrid}>
          {/* Left Column */}
          <View style={styles.leftColumn}>
            {/* Health Score Section */}
            <View style={styles.healthScoreCard}>
              <View style={styles.healthScoreLeft}>
                <Text style={styles.healthScoreLabel}>Health Score</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusEmoji}>🌿</Text>
                  <Text style={styles.statusText}>Good</Text>
                </View>
                <View style={styles.circularProgress}>
                  <View style={styles.progressRing}>
                    <Text style={styles.progressPercent}>76%</Text>
                    <Text style={styles.progressLabel}>Good</Text>
                  </View>
                </View>
              </View>
              <View style={styles.healthScoreRight}>
                <Text style={styles.dataTitle}>Based on did ruining data:</Text>
                <View style={styles.dataList}>
                  <View style={styles.dataItem}>
                    <Text style={styles.checkIcon}>✓</Text>
                    <Text style={styles.dataText}>Medication adherence : 66%</Text>
                  </View>
                  <View style={styles.dataItem}>
                    <Text style={styles.checkIcon}>✓</Text>
                    <Text style={styles.dataText}>Latest vitals: 19-99</Text>
                  </View>
                  <View style={styles.dataItem}>
                    <Text style={styles.checkIcon}>✓</Text>
                    <Text style={styles.dataText}>You're on track, keep it up!</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Latest Vitals Card */}
            <View style={styles.vitalsCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Latest Vitals</Text>
                <TouchableOpacity>
                  <Text style={styles.viewAllLink}>View All →</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.vitalItem}>
                <View style={styles.vitalIcon}>
                  <Text style={styles.vitalIconText}>🌿</Text>
                </View>
                <View style={styles.vitalInfo}>
                  <Text style={styles.vitalName}>Metformin 500 mg</Text>
                  <Text style={styles.vitalDesc}>Take 1 tablet twice daily</Text>
                  <View style={styles.vitalStatusRow}>
                    <View style={styles.takenBadge}>
                      <Text style={styles.takenText}>✓ Taken</Text>
                    </View>
                    <Text style={styles.dosageText}>500 mg</Text>
                  </View>
                </View>
                <View style={styles.vitalExpiry}>
                  <Text style={styles.expiryLabel}>EXPIRES/DUITE</Text>
                  <Text style={styles.expiryDate}>19 Mar 2026</Text>
                </View>
                <View style={styles.normalBadge}>
                  <Text style={styles.normalText}>Normal</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Right Sidebar */}
          <View style={styles.rightColumn}>
            {/* Rewards Card */}
            <View style={styles.rewardsCard}>
              <View style={styles.rewardsHeader}>
                <Text style={styles.rewardsIcon}>🏆</Text>
                <Text style={styles.rewardsTitle}>Rewards</Text>
                <View style={styles.rewardsIcons}>
                  <Text style={styles.miniIcon}>👤</Text>
                  <Text style={styles.miniIcon}>😊</Text>
                  <View style={styles.miniBadge}>
                    <Text style={styles.miniBadgeText}>2</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.streakLabel}>Adherence Streak</Text>
              <View style={styles.streakRow}>
                <Text style={styles.streakNumber}>4</Text>
                <Text style={styles.streakText}>days</Text>
                <Text style={styles.streakSubtext}>( Great job)</Text>
              </View>
              <Text style={styles.streakDesc}>You've taken your meds for 4 days in a row!</Text>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: '40%' }]} />
                </View>
                <Text style={styles.pointsText}>20 pts</Text>
              </View>
            </View>

            {/* Today's Schedule */}
            <View style={styles.scheduleCard}>
              <View style={styles.scheduleHeader}>
                <Text style={styles.scheduleTitle}>Today's Schedule</Text>
                <TouchableOpacity>
                  <Text style={styles.expandLink}>Expand →</Text>
                </TouchableOpacity>
              </View>

              {/* Morning */}
              <View style={styles.timeSlot}>
                <View style={styles.timeSlotHeader}>
                  <Text style={styles.timeLabel}>Morning</Text>
                  <Text style={styles.timeValue}>9:00 AM</Text>
                </View>
                <View style={styles.medicationItem}>
                  <View style={styles.medIcon}>
                    <Text style={styles.medIconText}>🌿</Text>
                  </View>
                  <View style={styles.medInfo}>
                    <Text style={styles.medName}>Metformin 500 mg</Text>
                    <Text style={styles.medStatus}>1 Taken 500 mg</Text>
                  </View>
                  <TouchableOpacity style={styles.takeBtn}>
                    <Text style={styles.takeBtnText}>✓ Take</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Evening */}
              <View style={styles.timeSlot}>
                <View style={styles.timeSlotHeader}>
                  <Text style={styles.timeLabel}>Evening</Text>
                  <Text style={styles.timeValue}>8:30 PM</Text>
                </View>
                <View style={styles.medicationItem}>
                  <View style={[styles.medIcon, styles.medIconPending]}>
                    <Text style={styles.medIconText}>💊</Text>
                  </View>
                  <View style={styles.medInfo}>
                    <Text style={styles.medName}>Metformin 500 mg</Text>
                    <Text style={styles.medStatusPending}>1 Pending 500 mg</Text>
                  </View>
                  <TouchableOpacity style={[styles.takeBtn, styles.takeBtnPending]}>
                    <Text style={styles.takeBtnTextPending}>Take</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f0f4f4',
  },
  scroll: { 
    flex: 1,
  },
  scrollContent: { 
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },

  // Top Navigation
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: '#0f766e',
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '700',
    marginLeft: SPACING.sm,
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  navItem: {
    paddingVertical: SPACING.xs,
  },
  navItemText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  navItemActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  avatarBtn: {
    marginLeft: SPACING.sm,
  },
  navAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navAvatarText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },

  // Welcome Card
  welcomeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    ...SHADOW.card,
  },
  welcomeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  welcomeAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0f766e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  welcomeAvatarText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '700',
  },
  welcomeText: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  welcomeActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  addBtn: {
    backgroundColor: '#0f766e',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
  },
  addBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  trendsBtn: {
    backgroundColor: '#0f766e',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
  },
  trendsBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },

  // Main Grid
  mainGrid: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  leftColumn: {
    flex: 2,
    gap: SPACING.lg,
  },
  rightColumn: {
    flex: 1,
    gap: SPACING.lg,
  },

  // Health Score Card
  healthScoreCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: SPACING.xl,
    ...SHADOW.card,
  },
  healthScoreLeft: {
    width: 140,
    alignItems: 'center',
  },
  healthScoreLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: SPACING.md,
  },
  statusEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },
  circularProgress: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    borderColor: '#0f766e',
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftColor: '#ccfbf1',
  },
  progressRing: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercent: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f766e',
  },
  progressLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  healthScoreRight: {
    flex: 1,
    paddingLeft: SPACING.xl,
  },
  dataTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  dataList: {
    gap: SPACING.sm,
  },
  dataItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIcon: {
    color: '#0f766e',
    fontSize: 14,
    marginRight: SPACING.sm,
  },
  dataText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  // Vitals Card
  vitalsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: SPACING.xl,
    ...SHADOW.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  viewAllLink: {
    fontSize: 14,
    color: '#0f766e',
    fontWeight: '500',
  },
  vitalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: SPACING.md,
  },
  vitalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  vitalIconText: {
    fontSize: 24,
  },
  vitalInfo: {
    flex: 1,
  },
  vitalName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  vitalDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  vitalStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  takenBadge: {
    backgroundColor: '#0f766e',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  takenText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
  },
  dosageText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  vitalExpiry: {
    alignItems: 'flex-end',
    marginRight: SPACING.md,
  },
  expiryLabel: {
    fontSize: 10,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  expiryDate: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  normalBadge: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  normalText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0ea5e9',
  },

  // Rewards Card
  rewardsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: SPACING.lg,
    ...SHADOW.card,
  },
  rewardsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  rewardsIcon: {
    fontSize: 20,
    marginRight: SPACING.xs,
  },
  rewardsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  rewardsIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniIcon: {
    fontSize: 16,
  },
  miniBadge: {
    backgroundColor: '#0f766e',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  streakLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: SPACING.xs,
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  streakText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginLeft: 4,
  },
  streakSubtext: {
    fontSize: 14,
    color: '#16a34a',
    marginLeft: 4,
  },
  streakDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0f766e',
    borderRadius: 4,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  // Schedule Card
  scheduleCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: SPACING.lg,
    ...SHADOW.card,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  expandLink: {
    fontSize: 13,
    color: '#0f766e',
    fontWeight: '500',
  },
  timeSlot: {
    marginBottom: SPACING.md,
  },
  timeSlotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  timeValue: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  medicationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: SPACING.sm,
  },
  medIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  medIconPending: {
    backgroundColor: '#fef3c7',
  },
  medIconText: {
    fontSize: 18,
  },
  medInfo: {
    flex: 1,
  },
  medName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  medStatus: {
    fontSize: 12,
    color: '#16a34a',
  },
  medStatusPending: {
    fontSize: 12,
    color: '#d97706',
  },
  takeBtn: {
    backgroundColor: '#0f766e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  takeBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  takeBtnPending: {
    backgroundColor: '#fbbf24',
  },
  takeBtnTextPending: {
    color: '#92400e',
    fontSize: 12,
    fontWeight: '600',
  },

});

export default PatientDashboard;
