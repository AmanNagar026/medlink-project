import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import ECGLogo from '../../components/ECGLogo';
import medicationService from '../../services/medicationService';
import { SHADOW } from '../../utils/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MOCK_REMINDERS = [
  { id: 'm1', medicationName: 'Lisinopril', dosage: '10mg', time: '08:00:00', description: 'Take with water before breakfast', status: 'taken', type: 'pill' },
  { id: 'm2', medicationName: 'Metformin', dosage: '500mg', time: '13:00:00', description: 'Take with lunch', status: 'missed', type: 'pill' },
  { id: 'm3', medicationName: 'Ventolin Inhaler', dosage: '2 puffs', time: '22:30:00', description: 'As needed for shortness of breath', status: 'pending', type: 'inhaler' },
  { id: 'm4', medicationName: 'Vitamin D3', dosage: '2000 IU', time: '23:00:00', description: 'Daily supplement', status: 'pending', type: 'pill' },
];

const RemindersScreen = () => {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('All');
  const [reminders, setReminders] = useState([]);
  const [countdown, setCountdown] = useState('');
  const [searchText, setSearchText] = useState('');

  const patientId = user?.profileId;

  const loadData = async () => {
    try {
      const todayMeds = await medicationService.getTodayIntakes(patientId);
      let reminderData = (todayMeds || []).map((med) => ({
        id: med.id,
        medicationName: med.medicationName,
        dosage: med.dosage,
        time: med.scheduledTime,
        description: med.instructions || 'Take as prescribed',
        status: (med.status || 'PENDING').toLowerCase(),
        type: 'pill',
      }));

      if (reminderData.length === 0) {
        reminderData = MOCK_REMINDERS;
      }

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setReminders(reminderData);
    } catch (err) {
      setReminders(MOCK_REMINDERS);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const nextDose = reminders.find((r) => r.status === 'pending');

  useEffect(() => {
    const interval = setInterval(() => {
      if (!nextDose?.time) return;
      const now = new Date();
      const doseTime = new Date();
      const [h, m, s] = nextDose.time.split(':');
      doseTime.setHours(parseInt(h, 10), parseInt(m, 10), parseInt(s || '0', 10));
      const diff = doseTime - now;
      if (diff <= 0) {
        setCountdown('DUE NOW');
        return;
      }
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setCountdown(`${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [nextDose]);

  const filteredReminders = reminders
    .filter((r) => {
      if (activeTab === 'Upcoming') return r.status === 'pending';
      if (activeTab === 'Missed') return r.status === 'missed';
      return true;
    })
    .filter((r) => r.medicationName.toLowerCase().includes(searchText.toLowerCase()));

  const stats = {
    taken: reminders.filter((r) => r.status === 'taken').length,
    missed: reminders.filter((r) => r.status === 'missed').length,
    pending: reminders.filter((r) => r.status === 'pending').length,
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {nextDose && (
        <View style={styles.urgentNudge}>
          <Text style={styles.nudgeText}>
            Next: <Text style={{ fontWeight: '900' }}>{nextDose.medicationName}</Text> in {countdown}
          </Text>
        </View>
      )}

      <View style={[styles.topNav, { backgroundColor: colors.primary }]}> 
        <View style={styles.navLeft}>
          <ECGLogo size={24} />
          <Text style={styles.navTitle}>MedLink</Text>
        </View>
        <Text style={styles.navActive}>Reminders</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.heroCard, { backgroundColor: colors.card }]}> 
          <View>
            <Text style={[styles.heroLabel, { color: colors.textSecondary }]}>Today's Reminders</Text>
            <Text style={[styles.heroValue, { color: colors.textPrimary }]}>{reminders.length}</Text>
          </View>
          <View style={styles.statsMiniRow}>
            <View style={styles.miniStat}><Text style={[styles.miniStatNum, { color: colors.primary }]}>{stats.taken}</Text><Text style={styles.miniStatLabel}>Taken</Text></View>
            <View style={styles.miniStat}><Text style={[styles.miniStatNum, { color: '#f87171' }]}>{stats.missed}</Text><Text style={styles.miniStatLabel}>Missed</Text></View>
            <View style={styles.miniStat}><Text style={[styles.miniStatNum, { color: '#f59e0b' }]}>{stats.pending}</Text><Text style={styles.miniStatLabel}>Pending</Text></View>
          </View>
        </View>

        <TextInput
          placeholder="Search medicines..."
          style={[styles.searchBar, { backgroundColor: colors.card, color: colors.textPrimary }]}
          placeholderTextColor={colors.textLight}
          onChangeText={setSearchText}
        />

        <View style={styles.tabs}>
          {['All', 'Upcoming', 'Missed'].map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setActiveTab(t)}
              style={[styles.tab, { backgroundColor: isDark ? colors.cardAlt : '#e2e8f0' }, activeTab === t && styles.activeTab]}
            >
              <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === t && styles.activeTabText]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {filteredReminders.map((med) => (
          <View key={med.id} style={[styles.medCard, { backgroundColor: colors.card }, med.status === 'missed' && styles.missedBorder]}>
            <View style={[styles.medIconContainer, { backgroundColor: colors.backgroundAlt }]}>
              <Text style={{ fontSize: 20 }}>{med.type === 'inhaler' ? '???' : '??'}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.medName, { color: colors.textPrimary }]}>{med.medicationName}</Text>
              <Text style={[styles.medDetails, { color: colors.primary }]}>{med.dosage} • {med.time.substring(0, 5)}</Text>
              <Text style={[styles.medDesc, { color: colors.textLight }]}>{med.description}</Text>
            </View>

            {med.status === 'pending' ? (
              <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Confirm', 'Mark as taken?')}>
                <Text style={styles.actionBtnText}>Take</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.badge, { backgroundColor: med.status === 'taken' ? '#dcfce7' : '#fee2e2' }]}>
                <Text style={{ color: med.status === 'taken' ? '#16a34a' : '#ef4444', fontWeight: 'bold', fontSize: 10 }}>
                  {med.status.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  urgentNudge: { backgroundColor: '#f97316', padding: 8, alignItems: 'center' },
  nudgeText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  topNav: { flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
  navTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
  navLeft: { flexDirection: 'row', alignItems: 'center' },
  navActive: { color: '#fff', fontWeight: '600' },
  scrollContent: { padding: 20 },
  heroCard: { padding: 20, borderRadius: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, ...SHADOW.card },
  heroLabel: { fontSize: 13 },
  heroValue: { fontSize: 36, fontWeight: '800' },
  statsMiniRow: { flexDirection: 'row', gap: 15 },
  miniStat: { alignItems: 'center' },
  miniStatNum: { fontWeight: 'bold' },
  miniStatLabel: { fontSize: 10, color: '#94a3b8' },
  searchBar: { padding: 12, borderRadius: 12, marginBottom: 15, ...SHADOW.card },
  tabs: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  activeTab: { backgroundColor: '#0f766e' },
  tabText: { fontWeight: '600' },
  activeTabText: { color: '#fff' },
  medCard: { padding: 16, borderRadius: 20, marginBottom: 12, flexDirection: 'row', alignItems: 'center', ...SHADOW.card },
  missedBorder: { borderLeftWidth: 4, borderLeftColor: '#ef4444' },
  medIconContainer: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  medName: { fontSize: 16, fontWeight: 'bold' },
  medDetails: { fontSize: 13, fontWeight: '600' },
  medDesc: { fontSize: 11, marginTop: 2 },
  actionBtn: { backgroundColor: '#0f766e', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
});

export default RemindersScreen;
