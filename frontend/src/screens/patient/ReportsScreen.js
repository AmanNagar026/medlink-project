import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import ECGLogo from '../../components/ECGLogo';
import medicationService from '../../services/medicationService';
import vitalsService from '../../services/vitalsService';
import COLORS from '../../utils/colors';
import { SPACING, TYPOGRAPHY, RADIUS, SHADOW } from '../../utils/theme';

const { width } = Dimensions.get('window');

const ReportsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState('7');
  const [adherence, setAdherence] = useState({ adherenceRate: 80, taken: 0, missed: 4 });
  const [avgGlucose, setAvgGlucose] = useState(95);
  const [avgHeartRate, setAvgHeartRate] = useState(72);
  const [medicines, setMedicines] = useState([
    { name: 'Metformin', dosage: '500 mg', adherence: 86, taken: 25, missed: 4, status: 'Taken' },
    { name: 'Amitriptyline', dosage: '25 mg', adherence: 64, taken: 7, missed: 3, status: 'Pending' },
    { name: 'Metformin', dosage: '500 mg', adherence: 64, taken: 3, missed: 4, status: 'Pending' },
  ]);
  const [activeTab, setActiveTab] = useState('Medications');

  const patientId = user?.profileId;

  const loadData = async () => {
    if (!patientId) return;
    try {
      const [adhData, vitalsData] = await Promise.all([
        medicationService.getAdherence(patientId),
        vitalsService.getTrendData(patientId, selectedFilter).catch(() => []),
      ]);
      setAdherence(adhData);
      // Calculate averages from vitals data
      if (vitalsData.length > 0) {
        const glucoseSum = vitalsData.reduce((acc, v) => acc + (v.glucose || 0), 0);
        const hrSum = vitalsData.reduce((acc, v) => acc + (v.heartRate || 0), 0);
        setAvgGlucose(Math.round(glucoseSum / vitalsData.length) || 95);
        setAvgHeartRate(Math.round(hrSum / vitalsData.length) || 72);
      }
    } catch (err) {
      console.error('Reports load error:', err);
    }
  };

  useFocusEffect(useCallback(() => {
    loadData();
  }, [selectedFilter]));

  const filters = [
    { key: 'all', label: 'All Time' },
    { key: '7', label: 'Last 7 Days' },
    { key: '30', label: 'Last 30 Days' },
    { key: '90', label: 'Last 90 Days' },
  ];

  const renderSummaryCard = (icon, value, label, sublabel, color, bgColor) => (
    <View style={[styles.summaryCard, { backgroundColor: bgColor }]}>
      <View style={styles.summaryIconContainer}>
        <Text style={[styles.summaryIcon, { color }]}>{icon}</Text>
      </View>
      <View style={styles.summaryContent}>
        <Text style={[styles.summaryValue, { color }]}>{value}</Text>
        <Text style={styles.summaryLabel}>{label}</Text>
        {sublabel && <Text style={styles.summarySublabel}>{sublabel}</Text>}
      </View>
    </View>
  );

  const renderGraph = () => {
    // Simple line graph representation
    const dataPoints = [45, 60, 55, 70, 65, 75, 60, 80, 70, 85];
    return (
      <View style={styles.graphContainer}>
        <View style={styles.graphHeader}>
          <View style={styles.graphTabs}>
            <TouchableOpacity 
              style={[styles.graphTab, activeTab === 'Medications' && styles.graphTabActive]}
              onPress={() => setActiveTab('Medications')}
            >
              <Text style={[styles.graphTabText, activeTab === 'Medications' && styles.graphTabTextActive]}>
                Medications
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.graphTab, activeTab === 'Vitals' && styles.graphTabActive]}
              onPress={() => setActiveTab('Vitals')}
            >
              <Text style={[styles.graphTabText, activeTab === 'Vitals' && styles.graphTabTextActive]}>
                🌿 Vitals
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.graphBody}>
          <View style={styles.yAxis}>
            <Text style={styles.yLabel}>100 Days</Text>
            <Text style={styles.yLabel}>50%</Text>
            <Text style={styles.yLabel}>0%</Text>
          </View>
          <View style={styles.graphArea}>
            {/* Grid lines */}
            <View style={styles.gridLine} />
            <View style={[styles.gridLine, { top: '50%' }]} />
            <View style={[styles.gridLine, { top: '100%' }]} />
            
            {/* Line graph */}
            <View style={styles.lineGraph}>
              {dataPoints.map((point, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.dataPoint, 
                    { 
                      left: `${(index / (dataPoints.length - 1)) * 100}%`,
                      bottom: `${point}%`,
                    }
                  ]} 
                />
              ))}
              <View style={styles.trendLine} />
            </View>
            
            {/* X Axis labels */}
            <View style={styles.xAxis}>
              {['Apr 1', 'Apr 6', 'Apr 9', 'Apr 13', 'Apr 16', 'Apr 17', 'Apr 21', 'Apr 23'].map((date, i) => (
                <Text key={i} style={styles.xLabel}>{date}</Text>
              ))}
            </View>
          </View>
        </View>
        
        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#0f766e' }]} />
            <Text style={styles.legendText}>✓ Taken</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#fbbf24' }]} />
            <Text style={styles.legendText}>Missed</Text>
          </View>
        </View>
        
        {/* As Needed */}
        <TouchableOpacity style={styles.asNeededRow}>
          <Text style={styles.asNeededText}>As Needed</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
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
          <Text style={styles.pageTitle}>Reports</Text>
        </View>
        <View style={styles.navRight}>
          <TouchableOpacity onPress={() => navigation.navigate('Dashboard')}>
            <Text style={styles.navItemText}>Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Schedule')}>
            <Text style={styles.navItemText}>Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItemWithBadge} onPress={() => navigation.navigate('History')}>
            <Text style={[styles.navItemText, styles.navActive]}>History</Text>
            <View style={styles.navBadge}>
              <Text style={styles.navBadgeText}>2</Text>
            </View>
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
        {/* Page Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitleText}>Reports</Text>
          <TouchableOpacity style={styles.exportBtn}>
            <Text style={styles.exportIcon}>↓</Text>
            <Text style={styles.exportText}>Export Reports</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[styles.filterTab, selectedFilter === filter.key && styles.filterTabActive]}
              onPress={() => setSelectedFilter(filter.key)}
            >
              <Text style={[styles.filterText, selectedFilter === filter.key && styles.filterTextActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          {renderSummaryCard('✓', `${adherence.adherenceRate || 80}%`, 'Medication Adherence', null, '#0f766e', '#f0fdf4')}
          {renderSummaryCard('🔔', `${adherence.missed || 4}`, 'Missed Doses', 'Medication won 1', '#d97706', '#fef3c7')}
          {renderSummaryCard('💧', `${avgGlucose || 95} mg/dL`, 'Avg. Blood Glucose', null, '#2563eb', '#eff6ff')}
          {renderSummaryCard('❤️', `${avgHeartRate || 72} bpm`, 'Avg. Heart Rate', null, '#ea580c', '#fff7ed')}
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Left - Graph */}
          <View style={styles.graphCard}>
            <View style={styles.graphTitleRow}>
              <Text style={styles.graphTitle}>Adherence Trends</Text>
              <TouchableOpacity style={styles.daysDropdown}>
                <Text style={styles.daysText}>▼ 30 Days</Text>
              </TouchableOpacity>
            </View>
            {renderGraph()}
          </View>

          {/* Right - Medicines Table */}
          <View style={styles.tableCard}>
            <Text style={styles.tableTitle}>Medicines</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Medicine</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Adherence</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Total Taken</Text>
              <Text style={[styles.tableHeaderText, { flex: 0.5, textAlign: 'right' }]}>Missed</Text>
            </View>
            {medicines.map((med, index) => (
              <View key={index} style={styles.tableRow}>
                <View style={[styles.tableCell, { flex: 2 }]}>
                  <Text style={styles.medName}>{med.name} <Text style={styles.medDosage}>{med.dosage}</Text></Text>
                  <Text style={styles.medStatus}>1 {med.status}, {med.dosage}</Text>
                </View>
                <View style={[styles.tableCell, { flex: 1, alignItems: 'center' }]}>
                  <View style={[styles.adherenceBadge, med.adherence >= 80 ? styles.adherenceGood : styles.adherenceWarning]}>
                    <Text style={[styles.adherenceText, med.adherence >= 80 ? styles.adherenceGoodText : styles.adherenceWarningText]}>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  pageTitleText: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  exportIcon: {
    fontSize: 14,
    color: '#0f766e',
    marginRight: 4,
  },
  exportText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0f766e',
    marginRight: 4,
  },
  chevron: {
    fontSize: 16,
    color: '#0f766e',
  },

  // Filter Tabs
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 4,
    marginBottom: SPACING.lg,
    ...SHADOW.card,
  },
  filterTab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#e2e8f0',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },

  // Summary Cards
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  summaryCard: {
    flex: 1,
    minWidth: (width - SPACING.lg * 2 - SPACING.md * 3) / 4,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 16,
  },
  summaryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  summaryIcon: {
    fontSize: 20,
  },
  summaryContent: {
    flex: 1,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  summarySublabel: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },

  // Main Content
  mainContent: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  graphCard: {
    flex: 1.5,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: SPACING.lg,
    ...SHADOW.card,
  },
  graphTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  graphTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  daysDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  daysText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  graphContainer: {
    marginTop: SPACING.md,
  },
  graphHeader: {
    marginBottom: SPACING.md,
  },
  graphTabs: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  graphTab: {
    paddingBottom: SPACING.xs,
  },
  graphTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#0f766e',
  },
  graphTabText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  graphTabTextActive: {
    color: '#0f766e',
    fontWeight: '600',
  },
  graphBody: {
    flexDirection: 'row',
    height: 200,
  },
  yAxis: {
    width: 50,
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  yLabel: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  graphArea: {
    flex: 1,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#e2e8f0',
    top: 0,
  },
  lineGraph: {
    flex: 1,
    position: 'relative',
  },
  dataPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0f766e',
  },
  trendLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '30%',
    height: 2,
    backgroundColor: '#0f766e',
    opacity: 0.3,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: SPACING.sm,
  },
  xLabel: {
    fontSize: 10,
    color: COLORS.textLight,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.lg,
    marginTop: SPACING.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  asNeededRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  asNeededText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  // Table Card
  tableCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: SPACING.lg,
    ...SHADOW.card,
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
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
  medName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  medDosage: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '400',
  },
  medStatus: {
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

export default ReportsScreen;
