import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Pressable,
  SafeAreaView,
  Alert,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import medicationService from '../../services/medicationService';
import prescriptionService from '../../services/prescriptionService';
import patientService from '../../services/patientService';
import COLORS from '../../utils/colors';
import { SPACING, RADIUS, SHADOW } from '../../utils/theme';

const defaultSummary = {
  activeMedications: 0,
  missedToday: 0,
  adherenceRate: 0,
  prescriptions: 0,
  takenToday: 0,
  pendingToday: 0,
  totalToday: 0,
  streakDays: 0,
};

const toLabelTime = (timeValue) => {
  if (!timeValue) return 'Not set';

  if (timeValue.includes('AM') || timeValue.includes('PM')) {
    return timeValue;
  }

  const [hourRaw = '0', minuteRaw = '00'] = timeValue.split(':');
  const hourNum = parseInt(hourRaw, 10);
  if (Number.isNaN(hourNum)) return timeValue;

  const period = hourNum >= 12 ? 'PM' : 'AM';
  const hour12 = hourNum % 12 === 0 ? 12 : hourNum % 12;
  return `${hour12}:${minuteRaw} ${period}`;
};

const statusTheme = {
  TAKEN: { text: 'Taken', color: '#047857', bg: '#d1fae5', icon: 'checkmark-circle' },
  MISSED: { text: 'Missed', color: '#b91c1c', bg: '#fee2e2', icon: 'close-circle' },
  SKIPPED: { text: 'Skipped', color: '#b45309', bg: '#fef3c7', icon: 'remove-circle' },
  PENDING: { text: 'Pending', color: '#334155', bg: '#e2e8f0', icon: 'time' },
};

const PatientDashboard = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { width } = useWindowDimensions();

  const patientId = user?.profileId || user?.id || user?.userId;

  const isDesktop = width >= 1100;
  const isTablet = width >= 760;

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [summary, setSummary] = useState(defaultSummary);
  const [todayMeds, setTodayMeds] = useState([]);
  const [activeMeds, setActiveMeds] = useState([]);
  const [trackerLimit, setTrackerLimit] = useState(5);
  const entranceAnim = useRef(new Animated.Value(0)).current;

  const pendingCount = useMemo(
    () => todayMeds.filter((med) => med.status === 'PENDING').length,
    [todayMeds]
  );

  const loadData = useCallback(async () => {
    if (!patientId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setLoading(true);
    try {
      const [summaryData, intakes, schedules] = await Promise.all([
        patientService.getDashboardSummary(patientId).catch(() => null),
        medicationService.getTodayIntakes(patientId),
        medicationService.getSchedule(patientId),
      ]);

      setTodayMeds(intakes || []);
      setActiveMeds((schedules || []).filter((item) => item.active));

      if (summaryData) {
        setSummary({ ...defaultSummary, ...summaryData });
      } else {
        const [adherence, prescriptions] = await Promise.all([
          medicationService.getAdherence(patientId).catch(() => null),
          prescriptionService.getActiveByPatient(patientId).catch(() => []),
        ]);

        const missedToday = (intakes || []).filter(
          (med) => med.status === 'MISSED' || med.status === 'SKIPPED'
        ).length;
        const takenToday = (intakes || []).filter((med) => med.status === 'TAKEN').length;

        setSummary({
          ...defaultSummary,
          activeMedications: (schedules || []).filter((item) => item.active).length,
          missedToday,
          adherenceRate: Math.round(adherence?.adherenceRate || 0),
          prescriptions: (prescriptions || []).length,
          takenToday,
          pendingToday: (intakes || []).filter((med) => med.status === 'PENDING').length,
          totalToday: (intakes || []).length,
        });
      }
    } catch (error) {
      console.error('Patient dashboard load error', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      const intervalId = setInterval(loadData, 30000);
      return () => clearInterval(intervalId);
    }, [loadData])
  );

  useEffect(() => {
    if (!loading) {
      entranceAnim.setValue(0);
      Animated.timing(entranceAnim, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [loading, entranceAnim]);

  const updateStatus = async (medication, status) => {
    try {
      await medicationService.updateIntakeStatus(medication.id, status);
      await loadData();
    } catch (error) {
      Alert.alert('Update failed', 'Could not update medication status. Try again.');
    }
  };

  const quickLinks = [
    { label: 'Add Medication', icon: 'add-circle', route: 'AddMedication' },
    { label: 'View Schedule', icon: 'calendar', route: 'Schedule' },
    { label: 'Log Vitals', icon: 'pulse', route: 'Vitals' },
    { label: 'Reminders', icon: 'notifications', route: 'Reminders' },
  ];

  const stats = [
    {
      title: 'Active Medications',
      value: summary.activeMedications,
      icon: 'medkit',
      colors: ['#0f766e', '#14b8a6'],
    },
    {
      title: 'Missed Dose',
      value: summary.missedToday,
      icon: 'close-circle',
      colors: ['#ef4444', '#f87171'],
    },
    {
      title: 'Adherence Rate',
      value: `${summary.adherenceRate}%`,
      icon: 'analytics',
      colors: ['#06b6d4', '#3b82f6'],
    },
    {
      title: 'Prescriptions',
      value: summary.prescriptions,
      icon: 'document-text',
      colors: ['#475569', '#64748b'],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'Patient'}`}
        subtitle="Here is your health overview for today."
        role="PATIENT"
        activeTab="Dashboard"
        navigation={navigation}
        user={user}
        onLogout={logout}
        rightAction={
          <TouchableOpacity
            style={styles.notificationBtn}
            onPress={() => navigation.navigate('Reminders')}
          >
            <Ionicons name="notifications-outline" size={22} color={COLORS.white} />
            {pendingCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{pendingCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        }
      />

      <Animated.ScrollView
        style={[
          styles.scroll,
          {
            opacity: entranceAnim,
            transform: [
              {
                translateY: entranceAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [8, 0],
                }),
              },
            ],
          },
        ]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
            tintColor={COLORS.primary}
          />
        }
      >
        <View style={[styles.statsGrid, isTablet && styles.statsGridTablet]}>
          {stats.map((stat) => (
            <Pressable
              key={stat.title}
              style={({ hovered, pressed }) => [
                styles.interactiveCard,
                hovered && styles.interactiveCardHover,
                pressed && styles.interactiveCardPressed,
                isDesktop && styles.statCardDesktop,
              ]}
            >
              <LinearGradient colors={stat.colors} style={styles.statCard}>
                <View style={styles.statTopRow}>
                  <Text style={styles.statTitle}>{stat.title}</Text>
                  <Ionicons name={stat.icon} size={18} color={COLORS.white} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
              </LinearGradient>
            </Pressable>
          ))}
        </View>

        <View style={[styles.contentColumns, isDesktop && styles.contentColumnsDesktop]}>
          <View style={styles.leftColumn}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Today's Medications</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Schedule')}>
                  <Text style={styles.linkText}>Open schedule</Text>
                </TouchableOpacity>
              </View>

              {loading ? (
                <Text style={styles.mutedText}>Loading medications...</Text>
              ) : todayMeds.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Ionicons name="medkit-outline" size={28} color={COLORS.textLight} />
                  <Text style={styles.mutedText}>No medications planned for today.</Text>
                </View>
              ) : (
                todayMeds.slice(0, 6).map((med) => {
                  const theme = statusTheme[med.status] || statusTheme.PENDING;
                  return (
                    <Pressable
                      key={med.id}
                      style={({ hovered }) => [styles.medRow, hovered && styles.medRowHover]}
                    >
                      <View style={styles.medDetails}>
                        <View style={styles.medIconWrap}>
                          <Ionicons name="pill" size={16} color={COLORS.primary} />
                        </View>
                        <View style={styles.medTextWrap}>
                          <Text style={styles.medName}>{med.medicationName || 'Medication'}</Text>
                          <Text style={styles.medMeta}>
                            {med.dosage || '1 dose'} | {toLabelTime(med.scheduledTime)}
                          </Text>
                        </View>
                      </View>

                      {med.status === 'PENDING' ? (
                        <View style={styles.medActionWrap}>
                          <TouchableOpacity
                            style={styles.takeBtn}
                            onPress={() => updateStatus(med, 'TAKEN')}
                          >
                            <Text style={styles.takeBtnText}>Take</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.skipBtn}
                            onPress={() => updateStatus(med, 'SKIPPED')}
                          >
                            <Text style={styles.skipBtnText}>Skip</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={[styles.statusBadge, { backgroundColor: theme.bg }]}>
                          <Ionicons name={theme.icon} size={14} color={theme.color} />
                          <Text style={[styles.statusText, { color: theme.color }]}>{theme.text}</Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })
              )}
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Medication Tracker</Text>
                <TouchableOpacity onPress={() => navigation.navigate('AddMedication')}>
                  <Text style={styles.linkText}>Add medication</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.limitRow}>
                {[5, 10, 15, 25, 50].map((count) => (
                  <Pressable
                    key={count}
                    style={({ hovered }) => [
                      styles.limitChip,
                      trackerLimit === count && styles.limitChipActive,
                      hovered && trackerLimit !== count && styles.limitChipHover,
                    ]}
                    onPress={() => setTrackerLimit(count)}
                  >
                    <Text
                      style={[
                        styles.limitChipText,
                        trackerLimit === count && styles.limitChipTextActive,
                      ]}
                    >
                      {count}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {activeMeds.length === 0 ? (
                <Text style={styles.mutedText}>No active medication schedule found.</Text>
              ) : (
                activeMeds.slice(0, trackerLimit).map((item) => (
                  <Pressable key={item.id} style={({ hovered }) => [styles.trackerRow, hovered && styles.trackerRowHover]}>
                    <View>
                      <Text style={styles.trackerName}>{item.medicationName}</Text>
                      <Text style={styles.trackerMeta}>
                        {item.dosage || 'Dose not set'} | {(item.frequency || 'DAILY').replace(/_/g, ' ')}
                      </Text>
                    </View>
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>Active</Text>
                    </View>
                  </Pressable>
                ))
              )}
            </View>
          </View>

          <View style={styles.rightColumn}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Adherence</Text>
              <View style={styles.rateWrap}>
                <Text style={styles.rateValue}>{summary.adherenceRate}%</Text>
                <Text style={styles.rateLabel}>Current adherence rate</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.min(100, summary.adherenceRate)}%` }]} />
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricText}>Taken: {summary.takenToday}</Text>
                <Text style={styles.metricText}>Missed: {summary.missedToday}</Text>
                <Text style={styles.metricText}>Pending: {summary.pendingToday}</Text>
              </View>
              <Text style={styles.streakText}>Streak: {summary.streakDays} day(s)</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Quick Navigation</Text>
              <View style={styles.quickGrid}>
                {quickLinks.map((item) => (
                  <Pressable
                    key={item.label}
                    style={({ hovered, pressed }) => [
                      styles.quickCard,
                      hovered && styles.quickCardHover,
                      pressed && styles.quickCardPressed,
                    ]}
                    onPress={() => navigation.navigate(item.route)}
                  >
                    <View style={styles.quickIconWrap}>
                      <Ionicons name={item.icon} size={20} color={COLORS.primary} />
                    </View>
                    <Text style={styles.quickLabel}>{item.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f6fb',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 110,
  },
  notificationBtn: {
    position: 'relative',
    marginLeft: SPACING.sm,
  },
  notificationBadge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statsGridTablet: {
    flexWrap: 'nowrap',
  },
  statCard: {
    width: '100%',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    minHeight: 112,
    ...SHADOW.cardElevated,
  },
  interactiveCard: {
    width: '48%',
    borderRadius: RADIUS.xl,
  },
  statCardDesktop: {
    width: undefined,
    flex: 1,
  },
  interactiveCardHover: {
    transform: [{ translateY: -2 }],
  },
  interactiveCardPressed: {
    transform: [{ scale: 0.99 }],
  },
  statTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statTitle: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 13,
    fontWeight: '600',
  },
  statValue: {
    color: COLORS.white,
    fontSize: 30,
    fontWeight: '700',
    marginTop: SPACING.md,
  },
  contentColumns: {
    flexDirection: 'column',
    gap: SPACING.lg,
  },
  contentColumnsDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  leftColumn: {
    flex: 2,
    gap: SPACING.lg,
  },
  rightColumn: {
    flex: 1,
    gap: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOW.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  linkText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  limitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  limitChip: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#d8e3ef',
    backgroundColor: '#f5f9fd',
  },
  limitChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#def7f2',
  },
  limitChipHover: {
    borderColor: '#b8ccdf',
  },
  limitChipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  limitChipTextActive: {
    color: COLORS.primary,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  },
  mutedText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  medRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: '#e8edf5',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    backgroundColor: '#f8fbff',
  },
  medRowHover: {
    borderColor: '#cfe3f3',
    backgroundColor: '#f3f8fd',
  },
  medDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  medIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#dbf4ef',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  medTextWrap: {
    flexShrink: 1,
  },
  medName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  medMeta: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  medActionWrap: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  takeBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  takeBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  skipBtn: {
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  skipBtnText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  trackerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#edf2f8',
    paddingVertical: SPACING.sm,
  },
  trackerRowHover: {
    backgroundColor: '#f8fbff',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
  },
  trackerName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  trackerMeta: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  activeBadge: {
    backgroundColor: '#d1fae5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  activeBadgeText: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '700',
  },
  rateWrap: {
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  rateValue: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.primary,
    lineHeight: 52,
  },
  rateLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  progressTrack: {
    width: '100%',
    height: 10,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0d9488',
    borderRadius: 999,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  metricText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  streakText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: SPACING.xs,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  quickCard: {
    width: '48%',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fbff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  quickCardHover: {
    borderColor: '#9dd7cb',
    backgroundColor: '#f1fbf8',
    transform: [{ translateY: -1 }],
  },
  quickCardPressed: {
    transform: [{ scale: 0.99 }],
  },
  quickIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dbf4ef',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  quickLabel: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default PatientDashboard;
