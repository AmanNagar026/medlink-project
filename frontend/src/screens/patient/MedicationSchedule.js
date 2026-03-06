import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../../utils/colors';

const MedicationSchedule = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [completedDoses, setCompletedDoses] = useState({}); // Changed to object to track doses per date
  const [filter, setFilter] = useState('All');

  // 1. Generate 14 days for the scroller
  const dates = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - 3 + i);
      return d;
    });
  }, []);

  // 2. Logic to change data based on selected date
  // In your real app, this is where you fetch from Spring Boot: 
  // axios.get(`/api/medications?date=${selectedDate.toISOString()}`)
  const getScheduleForDate = (date) => {
    const day = date.getDay();
    const dateKey = date.toDateString();

    // Example: Different meds for weekends vs weekdays
    if (day === 0 || day === 6) {
      return [
        { id: `${dateKey}-1`, time: '09:00 AM', name: 'Vitamin D3', dose: '1000 IU', instructions: 'Weekend Supplement', color: '#F1C40F' },
        { id: `${dateKey}-2`, time: '10:00 PM', name: 'Magnesium', dose: '200mg', instructions: 'Before sleep', color: '#9B59B6' },
      ];
    }
    
    return [
      { id: `${dateKey}-1`, time: '08:00 AM', name: 'Atorvastatin', dose: '20mg', instructions: 'After breakfast', color: '#4ECDC4' },
      { id: `${dateKey}-2`, time: '01:00 PM', name: 'Metformin', dose: '500mg', instructions: 'With lunch', color: '#FF6B6B' },
      { id: `${dateKey}-3`, time: '09:00 PM', name: 'Lisinopril', dose: '10mg', instructions: 'Before bed', color: '#45B7D1' },
    ];
  };

  const currentSchedule = getScheduleForDate(selectedDate);
  const dateKey = selectedDate.toDateString();

  const toggleDose = (id) => {
    setCompletedDoses(prev => ({
      ...prev,
      [dateKey]: prev[dateKey]?.includes(id) 
        ? prev[dateKey].filter(itemId => itemId !== id) 
        : [...(prev[dateKey] || []), id]
    }));
  };

  const isSameDay = (d1, d2) => 
    d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();

  const dosesForToday = completedDoses[dateKey] || [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.topHeader}>
          <Text style={styles.headerTitle}>Daily Schedule</Text>
          <View style={styles.progressBadge}>
            <Text style={styles.progressText}>{dosesForToday.length}/{currentSchedule.length}</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateStrip}>
          {dates.map((date, index) => {
            const active = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, new Date());
            return (
              <TouchableOpacity key={index} onPress={() => setSelectedDate(date)} style={[styles.dateCard, active && styles.activeDateCard]}>
                <Text style={[styles.dateDay, active && styles.activeDateText]}>{date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}</Text>
                <Text style={[styles.dateNumber, active && styles.activeDateText]}>{date.getDate()}</Text>
                {isToday && !active && <View style={styles.todayDot} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.filterBar}>
        {['All', 'Pending', 'Completed'].map((tab) => (
          <TouchableOpacity key={tab} onPress={() => setFilter(tab)} style={[styles.filterTab, filter === tab && styles.activeFilterTab]}>
            <Text style={[styles.filterTabText, filter === tab && styles.activeFilterTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {currentSchedule
          .filter(item => {
            if (filter === 'Pending') return !dosesForToday.includes(item.id);
            if (filter === 'Completed') return dosesForToday.includes(item.id);
            return true;
          })
          .map((item, index) => {
            const isCompleted = dosesForToday.includes(item.id);
            return (
              <View key={item.id} style={styles.timelineRow}>
                <View style={styles.timelineLeft}>
                  <Text style={styles.timeLabel}>{item.time}</Text>
                  {index !== currentSchedule.length - 1 && <View style={styles.timelineLine} />}
                </View>
                <TouchableOpacity onPress={() => toggleDose(item.id)} style={[styles.card, isCompleted ? styles.cardCompleted : { borderLeftColor: item.color }]}>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.medName, isCompleted && styles.textCompleted]}>{item.name}</Text>
                    <Text style={[styles.medDose, isCompleted && styles.textCompleted]}>{item.dose}</Text>
                    <Text style={styles.medInstructions}>{item.instructions}</Text>
                  </View>
                  <View style={[styles.statusIcon, isCompleted && styles.statusIconDone]}>
                    {isCompleted && <Ionicons name="checkmark" size={18} color="#FFF" />}
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerContainer: { backgroundColor: '#FFF', paddingVertical: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 5 },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1E293B' },
  progressBadge: { backgroundColor: '#E0F2F1', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  progressText: { color: '#00796B', fontWeight: 'bold' },
  dateStrip: { marginTop: 15, paddingHorizontal: 15 },
  dateCard: { width: 55, height: 75, justifyContent: 'center', alignItems: 'center', marginHorizontal: 5, borderRadius: 12, backgroundColor: '#F1F5F9' },
  activeDateCard: { backgroundColor: COLORS.primary || '#0D9488' },
  dateDay: { fontSize: 10, fontWeight: 'bold', color: '#64748B' },
  dateNumber: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  activeDateText: { color: '#FFF' },
  todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#0D9488', marginTop: 4 },
  filterBar: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 20 },
  filterTab: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 15, marginRight: 8, backgroundColor: '#E2E8F0' },
  activeFilterTab: { backgroundColor: '#334155' },
  filterTabText: { color: '#64748B', fontWeight: '600', fontSize: 12 },
  activeFilterTabText: { color: '#FFF' },
  scrollContent: { padding: 20 },
  timelineRow: { flexDirection: 'row', minHeight: 100 },
  timelineLeft: { width: 70, alignItems: 'center' },
  timeLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8' },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#E2E8F0', marginVertical: 5 },
  card: { flex: 1, backgroundColor: '#FFF', borderRadius: 15, padding: 15, marginBottom: 15, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 5, elevation: 2 },
  cardCompleted: { opacity: 0.6, backgroundColor: '#F1F5F9', borderLeftColor: '#CBD5E1' },
  cardInfo: { flex: 1 },
  medName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  medDose: { fontSize: 13, color: '#64748B' },
  medInstructions: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  textCompleted: { textDecorationLine: 'line-through' },
  statusIcon: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#CBD5E1', justifyContent: 'center', alignItems: 'center' },
  statusIconDone: { backgroundColor: '#10B981', borderColor: '#10B981' }
});

export default MedicationSchedule;