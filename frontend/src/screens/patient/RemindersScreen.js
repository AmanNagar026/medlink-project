import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import ECGLogo from '../../components/ECGLogo';
import medicationService from '../../services/medicationService';
import COLORS from '../../utils/colors';
import { SPACING, TYPOGRAPHY, RADIUS, SHADOW } from '../../utils/theme';

const RemindersScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('All');
  const [reminders, setReminders] = useState([
    {
      id: 1,
      type: 'upcoming',
      medicationName: 'Metformin',
      dosage: '500 mg',
      time: '12:00 PM',
      description: 'Evening poss fetficited',
      status: 'pending',
      icon: '⏱',
      iconBg: '#fef3c7',
    },
    {
      id: 2,
      type: 'alert',
      medicationName: 'Amitriptyline',
      dosage: '25 mg',
      time: '1:00 PM',
      description: 'Afternoon dose 1:00 PM',
      status: 'scheduled',
      scheduledTime: '8:30 PM',
      icon: '🔔',
      iconBg: '#fee2e2',
    },
  ]);
  const [streakDays, setStreakDays] = useState(4);
  const [medicines] = useState([
    { name: 'Metformin', dosage: '500 mg', adherence: 60, taken: 25, missed: 4, status: '1 Peadi dose 20 mg' },
  ]);

  const patientId = user?.profileId;

  const loadData = async () => {
    if (!patientId) return;
    try {
      const todayMeds = await medicationService.getTodayIntakes(patientId);
      // Transform medications to reminders format
      const reminderData = todayMeds
        .filter(med => med.status === 'PENDING')
        .map(med => ({
          id: med.id,
          type: 'upcoming',
          medicationName: med.medicationName,
          dosage: med.dosage,
          time: med.scheduledTime,
          description: med.instructions || 'Take as prescribed',
          status: med.status.toLowerCase(),
          icon: '⏱',
          iconBg: '#fef3c7',
        }));
      setReminders(reminderData);
    } catch (err) {
      console.error('Reminders load error:', err);
    }
  };

  useFocusEffect(useCallback(() => {
    loadData();
  }, []));

  const tabs = ['All', 'Today', 'Upcoming', 'Missed'];
  const pendingCount = reminders.filter(r => r.status === 'pending').length;

  const handleTake = async (reminder) => {
    try {
      await medicationService.updateIntakeStatus(reminder.id, 'TAKEN');
      loadData();
    } catch (err) {
      console.error('Take error:', err);
    }
  };

  const filteredReminders = reminders.filter(r => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Today') return r.type === 'today' || r.type === 'upcoming';
    if (activeTab === 'Upcoming') return r.type === 'upcoming';
    if (activeTab === 'Missed') return r.type === 'missed';
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Navigation */}
      <View style={styles.topNav}>
        <View style={styles.navLeft}>
          <ECGLogo size={32} />
          <Text style={styles.navTitle}>MedLink</Text>
          <Text style={styles.pageTitle}>Reminders</Text>
        </View>
        <View style={styles.navRight}>
          <TouchableOpacity onPress={() => navigation.navigate('Dashboard')}>
            <Text style={styles.navItemText}>Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Schedule')}>
            <Text style={styles.navItemText}>Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('History')}>
            <Text style={styles.navItemText}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItemWithBadge}>
            <Text style={[styles.navItemText, styles.navActive]}>Reminders</Text>
            {pendingCount > 0 && (
              <View style={styles.navBadge}>
                <Text style={styles.navBadgeText}>{pendingCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarBtn}>
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
      >
        {/* Page Title */}
        <Text style={styles.pageHeader}>Reminders</Text>

        {/* Filter Tabs */}
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          {/* Upcoming Header */}
          <View style={styles.upcomingHeader}>
            <View style={styles.upcomingBadge}>
              <Text style={styles.upcomingText}>Upcoming</Text>
            </View>
            <Text style={styles.upcomingDesc}>📝 Now 9art reds for reminders</Text>
          </View>

          {/* Reminder Cards */}
          {filteredReminders.map((reminder) => (
            <View key={reminder.id} style={styles.reminderCard}>
              <View style={[styles.reminderIcon, { backgroundColor: reminder.iconBg }]}>
                <Text style={styles.reminderIconText}>{reminder.icon}</Text>
              </View>
              <View style={styles.reminderInfo}>
                <Text style={styles.reminderName}>
                  {reminder.medicationName} <Text style={styles.reminderDosage}>{reminder.dosage}</Text>
                </Text>
                <Text style={styles.reminderDesc}>{reminder.description}</Text>
              </View>
              <View style={styles.reminderTime}>
                <Text style={styles.timeIcon}>⏱</Text>
                <Text style={styles.timeText}>{reminder.time}</Text>
              </View>
              <View style={styles.reminderStatus}>
                <Text style={styles.statusCheck}>✓</Text>
                <Text style={styles.statusName}>Matt</Text>
                <Text style={styles.statusDesc}>Treen dose scheduled for {reminder.scheduledTime || '8:30 PM'}</Text>
              </View>
              {reminder.status === 'pending' ? (
                <TouchableOpacity style={styles.takeBtn} onPress={() => handleTake(reminder)}>
                  <Text style={styles.takeBtnText}>Take</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.historyBtn}>
                  <Text style={styles.historyBtnText}>View History</Text>
                  <View style={styles.historyDot} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Rewards Section */}
        <View style={styles.section}>
          <View style={styles.rewardsHeader}>
            <Text style={styles.sectionTitle}>Rewards</Text>
            <TouchableOpacity>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.rewardsContent}>
            <View style={styles.streakSection}>
              <View style={styles.streakHeader}>
                <Text style={styles.streakIcon}>🏆</Text>
                <Text style={styles.streakTitle}>Adherence Streak: <Text style={styles.streakNumber}>{streakDays} days</Text> <Text style={styles.streakSubtext}>( Great job! )</Text></Text>
              </View>
              <Text style={styles.streakDesc}>You've taken your meds for {streakDays} days in a row!</Text>
              <View style={styles.avatarsRow}>
                <View style={styles.miniAvatar}><Text style={styles.miniAvatarText}>👤</Text></View>
                <View style={styles.miniAvatar}><Text style={styles.miniAvatarText}>👤</Text></View>
                <View style={styles.miniAvatar}><Text style={styles.miniAvatarText}>👤</Text></View>
              </View>
            </View>

            {/* Medicines Table */}
            <View style={styles.tableSection}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 2 }]}>Medicine</Text>
                <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Adherence</Text>
                <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Total Taken</Text>
                <Text style={[styles.tableHeaderText, { flex: 0.5, textAlign: 'right' }]}>Missed</Text>
              </View>
              {medicines.map((med, index) => (
                <View key={index} style={styles.tableRow}>
                  <View style={[styles.tableCell, { flex: 2 }]}>
                    <Text style={styles.tableMedName}>{med.name} <Text style={styles.tableMedDosage}>{med.dosage}</Text></Text>
                    <Text style={styles.tableMedStatus}>{med.status}</Text>
                  </View>
                  <View style={[styles.tableCell, { flex: 1, alignItems: 'center' }]}>
                    <View style={[styles.adherenceBadge, med.adherence >= 70 ? styles.adherenceGood : styles.adherenceWarning]}>
                      <Text style={[styles.adherenceText, med.adherence >= 70 ? styles.adherenceGoodText : styles.adherenceWarningText]}>
                        {med.adherence}%
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.tableCellText, { flex: 1, textAlign: 'center' }]}>{med.taken}</Text>
                  <Text style={[styles.tableCellText, { flex: 0.5, textAlign: 'right' }]}>{med.missed}</Text>
                </View>
              ))}
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
    fontSize: 18,
    fontWeight: '700',
    marginLeft: SPACING.sm,
    marginRight: SPACING.md,
  },
  pageTitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  navItemText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  navActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  navItemWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  navBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  avatarBtn: {
    marginLeft: SPACING.sm,
  },
  navAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navAvatarText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },

  // Page Header
  pageHeader: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 4,
    marginBottom: SPACING.lg,
    ...SHADOW.card,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#e2e8f0',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },

  // Section
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOW.card,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },

  // Upcoming Header
  upcomingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  upcomingBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: SPACING.md,
  },
  upcomingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d97706',
  },
  upcomingDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  // Reminder Card
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fefce8',
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  reminderIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  reminderIconText: {
    fontSize: 20,
  },
  reminderInfo: {
    flex: 1,
    minWidth: 100,
  },
  reminderName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  reminderDosage: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '400',
  },
  reminderDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  reminderTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  timeIcon: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginRight: 4,
  },
  timeText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  reminderStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.md,
  },
  statusCheck: {
    color: '#0f766e',
    fontSize: 12,
    marginRight: 4,
  },
  statusName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#d97706',
    marginRight: 4,
  },
  statusDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  takeBtn: {
    backgroundColor: '#0f766e',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  takeBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  historyBtnText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginRight: 8,
  },
  historyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94a3b8',
  },

  // Rewards Section
  rewardsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  chevron: {
    fontSize: 20,
    color: COLORS.textLight,
  },
  rewardsContent: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  streakSection: {
    flex: 1,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  streakIcon: {
    fontSize: 20,
    marginRight: SPACING.xs,
  },
  streakTitle: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  streakNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  streakSubtext: {
    fontSize: 13,
    color: '#16a34a',
  },
  streakDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  avatarsRow: {
    flexDirection: 'row',
    gap: -8,
  },
  miniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: -8,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  miniAvatarText: {
    fontSize: 12,
  },

  // Table Section
  tableSection: {
    flex: 1.5,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
  },
  tableCell: {
    justifyContent: 'center',
  },
  tableCellText: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  tableMedName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  tableMedDosage: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '400',
  },
  tableMedStatus: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  adherenceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adherenceGood: {
    backgroundColor: '#f0fdf4',
  },
  adherenceWarning: {
    backgroundColor: '#fef3c7',
  },
  adherenceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  adherenceGoodText: {
    color: '#16a34a',
  },
  adherenceWarningText: {
    color: '#d97706',
  },
});

export default RemindersScreen;
