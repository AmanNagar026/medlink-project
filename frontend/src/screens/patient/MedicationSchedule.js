import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, Pressable, Animated, RefreshControl, useWindowDimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import medicationService from '../../services/medicationService';
import COLORS from '../../utils/colors';
import { SPACING, RADIUS, SHADOW } from '../../utils/theme';

const FILTERS = ['All', 'Pending', 'Taken', 'Missed'];

const statusTheme = {
  TAKEN: { color: '#047857', bg: '#d1fae5', icon: 'checkmark-circle' },
  MISSED: { color: '#b91c1c', bg: '#fee2e2', icon: 'close-circle' },
  SKIPPED: { color: '#b45309', bg: '#fef3c7', icon: 'remove-circle' },
  PENDING: { color: '#334155', bg: '#e2e8f0', icon: 'time' },
};

const toLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const MedicationSchedule = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < 600;
  const [intakes, setIntakes] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const entrance = useState(new Animated.Value(1))[0];

  const patientId = user?.profileId || user?.id || user?.userId;

  const loadIntakes = useCallback(async (date = selectedDate) => {
    if (!patientId) return;
    setLoading(true);
    try {
      const dateStr = toLocalDateString(date);
      const data = await medicationService.getIntakesByDate(patientId, dateStr);
      setIntakes(data || []);
    } catch (err) {
      console.error('Load intakes error:', err);
      Alert.alert('Error', 'Failed to load medications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientId, selectedDate]);

  useFocusEffect(
    useCallback(() => {
      loadIntakes(selectedDate);
      const interval = setInterval(() => loadIntakes(selectedDate), 30000);
      return () => clearInterval(interval);
    }, [loadIntakes, selectedDate])
  );

  const dates = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - 3 + i);
      return d;
    });
  }, []);

  const isSameDay = (d1, d2) =>
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();

  const filteredSchedule = useMemo(() => {
    if (filter === 'All') return intakes;
    if (filter === 'Taken') return intakes.filter((item) => item.status === 'TAKEN');
    if (filter === 'Pending') return intakes.filter((item) => item.status === 'PENDING');
    if (filter === 'Missed') return intakes.filter((item) => item.status === 'MISSED' || item.status === 'SKIPPED');
    return intakes;
  }, [intakes, filter]);

  const takenCount = intakes.filter((i) => i.status === 'TAKEN').length;

  const handleStatusUpdate = async (intake, nextStatus) => {
    try {
      await medicationService.updateIntakeStatus(intake.id, nextStatus);
      await loadIntakes(selectedDate);
    } catch (err) {
      console.error('Update intake error:', err);
      Alert.alert('Error', 'Could not update medication status');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Daily Schedule"
        subtitle="Manage your medication timeline"
        role="PATIENT"
        activeTab="Schedule"
        navigation={navigation}
        user={user}
        onLogout={logout}
      />

      <Animated.View style={{ flex: 1, opacity: entrance }}>
        <View style={styles.headerContainer}>
          <View style={styles.topHeader}>
            <Text style={styles.headerTitle}>Today's Progress</Text>
            <View style={styles.progressBadge}>
              <Text style={styles.progressText}>{takenCount}/{intakes.length || 0}</Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateStrip}>
            {dates.map((date, index) => {
              const active = isSameDay(date, selectedDate);
              const today = isSameDay(date, new Date());
              return (
                <Pressable
                  key={index}
                  style={({ hovered, pressed }) => [
                    styles.dateCard,
                    active && styles.activeDateCard,
                    hovered && !active && styles.dateCardHover,
                    pressed && styles.dateCardPress,
                  ]}
                  onPress={() => {
                    setSelectedDate(date);
                    loadIntakes(date);
                  }}
                >
                  <Text style={[styles.dateDay, active && styles.activeDateText]}>
                    {date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                  </Text>
                  <Text style={[styles.dateNumber, active && styles.activeDateText]}>{date.getDate()}</Text>
                  {today && !active && <View style={styles.todayDot} />}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={[styles.filterBar, isMobile && styles.filterBarWrap]}>
          {FILTERS.map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setFilter(tab)}
              style={({ hovered, pressed }) => [
                styles.filterTab,
                filter === tab && styles.activeFilterTab,
                hovered && filter !== tab && styles.filterTabHover,
                pressed && styles.filterTabPress,
              ]}
            >
              <Text style={[styles.filterTabText, filter === tab && styles.activeFilterTabText]}>{tab}</Text>
            </Pressable>
          ))}
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadIntakes(selectedDate); }} />}
        >
          {loading ? (
            <View style={styles.loadingContainer}><Text style={styles.loadingText}>Loading medications...</Text></View>
          ) : filteredSchedule.length === 0 ? (
            <View style={styles.loadingContainer}><Text style={styles.loadingText}>No medications for this filter/date.</Text></View>
          ) : (
            filteredSchedule.map((item, index) => {
              const theme = statusTheme[item.status] || statusTheme.PENDING;
              return (
                <View key={item.id || index} style={[styles.timelineRow, isMobile && styles.timelineRowStack]}>
                  <View style={[styles.timelineLeft, isMobile && styles.timelineLeftMobile]}>
                    <Text style={styles.timeLabel}>{item.scheduledTime || '09:00 AM'}</Text>
                    {index !== filteredSchedule.length - 1 && <View style={styles.timelineLine} />}
                  </View>

                  <Pressable style={({ hovered }) => [styles.card, isMobile && styles.cardMobile, hovered && styles.cardHover]}>
                    <View style={styles.cardInfo}>
                      <Text style={styles.medName}>{item.medicationName || 'Medication'}</Text>
                      <Text style={styles.medDose}>{item.dosage || `${item.dosageQuantity || 1} dose`}</Text>
                      {item.notes ? <Text style={styles.medInstructions}>{item.notes}</Text> : null}
                    </View>

                    {item.status === 'PENDING' ? (
                      <View style={[styles.actionsCol, isMobile && styles.actionsRowMobile]}>
                        <TouchableOpacity style={styles.takeBtn} onPress={() => handleStatusUpdate(item, 'TAKEN')}>
                          <Text style={styles.takeBtnText}>Take</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.skipBtn} onPress={() => handleStatusUpdate(item, 'SKIPPED')}>
                          <Text style={styles.skipBtnText}>Skip</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={[styles.statusBadge, { backgroundColor: theme.bg }]}>
                        <Ionicons name={theme.icon} size={14} color={theme.color} />
                        <Text style={[styles.statusText, { color: theme.color }]}>{item.status}</Text>
                      </View>
                    )}
                  </Pressable>
                </View>
              );
            })
          )}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f6fb',
  },
  headerContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 14,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...SHADOW.card,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  progressBadge: {
    backgroundColor: '#def7f2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  progressText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  dateStrip: {
    marginTop: 12,
    paddingHorizontal: SPACING.md,
  },
  dateCard: {
    width: 60,
    height: 78,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
    borderRadius: 14,
    backgroundColor: '#eff4f9',
    borderWidth: 1,
    borderColor: '#e1e9f3',
  },
  dateCardHover: {
    backgroundColor: '#e8f2fb',
    borderColor: '#c8dff1',
  },
  dateCardPress: {
    transform: [{ scale: 0.98 }],
  },
  activeDateCard: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dateDay: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  dateNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  activeDateText: {
    color: COLORS.white,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginTop: 4,
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginTop: 14,
    gap: 8,
  },
  filterBarWrap: {
    flexWrap: 'wrap',
  },
  filterTab: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#e5ecf4',
  },
  filterTabHover: {
    backgroundColor: '#d9e5f2',
  },
  filterTabPress: {
    transform: [{ scale: 0.98 }],
  },
  activeFilterTab: {
    backgroundColor: '#134e4a',
  },
  filterTabText: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: 12,
  },
  activeFilterTabText: {
    color: '#fff',
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  loadingContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 96,
    marginBottom: 12,
  },
  timelineRowStack: {
    flexDirection: 'column',
    minHeight: 0,
    gap: 6,
  },
  timelineLeft: {
    width: 78,
    alignItems: 'center',
    paddingRight: 10,
  },
  timelineLeftMobile: {
    width: '100%',
    alignItems: 'flex-start',
    paddingRight: 0,
  },
  timeLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#dbe5ef',
    marginVertical: 4,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e5edf5',
    ...SHADOW.card,
  },
  cardMobile: {
    width: '100%',
    flex: 0,
  },
  cardHover: {
    borderColor: '#cfdfee',
    backgroundColor: '#f8fbff',
  },
  cardInfo: {
    flex: 1,
    paddingRight: 8,
  },
  medName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  medDose: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 1,
  },
  medInstructions: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  actionsCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  actionsRowMobile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  takeBtn: {
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  takeBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  skipBtn: {
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 7,
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
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
});

export default MedicationSchedule;
