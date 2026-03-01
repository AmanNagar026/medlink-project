import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import ECGLogo from '../../components/ECGLogo';
import medicationService from '../../services/medicationService';
import COLORS from '../../utils/colors';
import { SPACING, TYPOGRAPHY, RADIUS, SHADOW } from '../../utils/theme';

const MedicationSchedule = ({ navigation }) => {
  const { user } = useAuth();
  const [intakes, setIntakes] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const loadIntakes = async (date) => {
    if (!user?.profileId) return;
    try {
      const dateStr = date.toISOString().split('T')[0];
      const data = await medicationService.getIntakesByDate(
        user.profileId,
        dateStr
      );
      setIntakes(data);
    } catch (err) {
      console.error('Load intakes error:', err);
    }
  };

  useFocusEffect(useCallback(() => {
    loadIntakes(selectedDate);
  }, [selectedDate]));

  const getDayDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = -3; i <= 3; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const isSelected = (date) =>
    date.toDateString() === selectedDate.toDateString();

  const isToday = (date) =>
    date.toDateString() === new Date().toDateString();

  const handleTake = async (med) => {
    try {
      await medicationService.updateIntakeStatus(med.id, 'TAKEN');
      loadIntakes(selectedDate);
    } catch (err) {
      Alert.alert('Error', 'Could not update medication status');
    }
  };

  // Group medications by time of day
  const groupByTimeOfDay = (meds) => {
    const groups = {
      morning: [],
      afternoon: [],
      evening: [],
      asNeeded: [],
    };
    
    meds.forEach(med => {
      const hour = parseInt(med.scheduledTime?.split(':')[0]) || 0;
      const isAm = med.scheduledTime?.includes('AM');
      
      if (med.frequency === 'AS_NEEDED') {
        groups.asNeeded.push(med);
      } else if ((isAm && hour >= 5 && hour < 12) || (hour >= 5 && hour < 12)) {
        groups.morning.push(med);
      } else if ((isAm && hour >= 12) || (!isAm && hour < 5) || (hour >= 12 && hour < 17)) {
        groups.afternoon.push(med);
      } else {
        groups.evening.push(med);
      }
    });
    
    return groups;
  };

  const groupedMeds = groupByTimeOfDay(intakes);
  const pendingCount = intakes.filter((i) => i.status === 'PENDING').length;

  const formatDateHeader = (date) => {
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options);
  };

  const renderMedicationRow = (med, index) => (
    <View key={med.id || index} style={styles.medRow}>
      <Text style={styles.medTime}>{med.scheduledTime || '9:00 AM'}</Text>
      <View style={styles.medInfo}>
        <Text style={styles.medName}>{med.medicationName || 'Metformin'} {med.dosage || '500 mg'}</Text>
        <Text style={styles.medDosage}>{med.instructions || '30 Ayle'}</Text>
      </View>
      {med.status === 'TAKEN' ? (
        <View style={styles.statusBadge}>
          <Text style={styles.statusCheck}>✓</Text>
          <Text style={styles.statusText}>Today</Text>
        </View>
      ) : (
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingIcon}>⏱</Text>
          <Text style={styles.pendingText}>Take</Text>
        </View>
      )}
      <View style={styles.medIcon}>
        <Text style={styles.medIconText}>💧</Text>
      </View>
      <View style={styles.medDetails}>
        <Text style={styles.medDetailName}>{med.medicationName || 'Amitrituline'} {med.dosage || '25 mg'}</Text>
        <Text style={styles.medDetailStatus}>1 {med.status === 'TAKEN' ? 'Taken' : 'Pending'}, {med.dosage || '500mg'}</Text>
      </View>
      {med.status === 'TAKEN' ? (
        <View style={styles.takenBtn}>
          <Text style={styles.takenBtnText}>Take</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.takeBtn} onPress={() => handleTake(med)}>
          <Text style={styles.takeBtnText}>Take</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderSection = (title, meds) => {
    if (meds.length === 0) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionContent}>
          {meds.map((med, index) => renderMedicationRow(med, index))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Navigation */}
      <View style={styles.topNav}>
        <View style={styles.navLeft}>
          <ECGLogo size={32} />
          <Text style={styles.navTitle}>MedLink</Text>
          <Text style={styles.pageTitle}>Medication Schedule</Text>
        </View>
        <View style={styles.navRight}>
          <TouchableOpacity onPress={() => navigation.navigate('Dashboard')}>
            <Text style={styles.navItemText}>Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={[styles.navItemText, styles.navActive]}>Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItemWithBadge} onPress={() => navigation.navigate('History')}>
            <Text style={styles.navItemText}>History</Text>
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
        <Text style={styles.pageHeader}>Medication Schedule</Text>

        {/* Week Strip */}
        <View style={styles.weekCard}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.weekStrip}
          >
            {getDayDates().map((date, index) => {
              const dayName = date.toLocaleDateString('en', { weekday: 'short' }).toUpperCase().slice(0, 3);
              const isSelectedDate = isSelected(date);
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayItem,
                    isSelectedDate && styles.dayActive,
                  ]}
                  onPress={() => setSelectedDate(date)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.dayName,
                      isSelectedDate && styles.dayTextActive,
                    ]}
                  >
                    {dayName}
                  </Text>
                  <Text
                    style={[
                      styles.dayNum,
                      isSelectedDate && styles.dayTextActive,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Selected Date */}
        <Text style={styles.selectedDate}>{formatDateHeader(selectedDate)}</Text>

        {/* Medication Sections */}
        <View style={styles.sectionsContainer}>
          {renderSection('Morning', groupedMeds.morning)}
          {renderSection('Afternoon', groupedMeds.afternoon)}
          {renderSection('Evening', groupedMeds.evening)}
          
          {/* As Needed Section */}
          <TouchableOpacity style={styles.asNeededRow}>
            <Text style={styles.asNeededText}>As Needed</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
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

  // Week Strip
  weekCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.lg,
    ...SHADOW.card,
  },
  weekStrip: { 
    paddingHorizontal: SPACING.xs,
  },
  dayItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 72,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  dayActive: { 
    backgroundColor: '#0f766e',
  },
  dayName: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  dayNum: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  dayTextActive: { 
    color: COLORS.white,
  },

  // Selected Date
  selectedDate: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },

  // Sections
  sectionsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    overflow: 'hidden',
    ...SHADOW.card,
  },
  section: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  sectionContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },

  // Medication Row
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  medTime: {
    width: 70,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  medInfo: {
    flex: 1,
    minWidth: 120,
  },
  medName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  medDosage: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: SPACING.md,
  },
  statusCheck: {
    color: '#16a34a',
    fontSize: 12,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: SPACING.md,
  },
  pendingIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d97706',
  },
  medIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  medIconText: {
    fontSize: 16,
  },
  medDetails: {
    flex: 1,
  },
  medDetailName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  medDetailStatus: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  takeBtn: {
    backgroundColor: '#0f766e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  takeBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },
  takenBtn: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  takenBtnText: {
    color: '#92400e',
    fontSize: 13,
    fontWeight: '600',
  },

  // As Needed
  asNeededRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  asNeededText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  chevron: {
    fontSize: 20,
    color: COLORS.textLight,
  },

  // Bottom Navigation
});

export default MedicationSchedule;
