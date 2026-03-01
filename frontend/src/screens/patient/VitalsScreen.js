import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import CustomButton from '../../components/CustomButton';
import vitalsService from '../../services/vitalsService';
import COLORS from '../../utils/colors';
import { SPACING, TYPOGRAPHY, RADIUS, SHADOW } from '../../utils/theme';

const VitalsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [vitals, setVitals] = useState([]);
  const [latestVitals, setLatestVitals] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state
  const [form, setForm] = useState({
    systolicBP: '',
    diastolicBP: '',
    heartRate: '',
    glucose: '',
    glucoseUnit: 'mg/dL',
    stressLevel: '',
    temperature: '',
    temperatureUnit: 'Celsius',
    oxygenSaturation: '',
    weight: '',
    weightUnit: 'kg',
    notes: '',
  });

  const patientId = user?.profileId;

  const loadData = async () => {
    if (!patientId) return;
    try {
      const [allVitals, latest] = await Promise.all([
        vitalsService.getByPatient(patientId),
        vitalsService.getLatest(patientId).catch(() => null),
      ]);
      setVitals(allVitals);
      setLatestVitals(latest);
    } catch (err) {
      console.error('Error loading vitals:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => {
    loadData();
  }, [patientId]));

  const handleSubmit = async () => {
    try {
      const vitalData = {
        patientId,
        patientName: user?.name,
        systolicBP: form.systolicBP ? parseInt(form.systolicBP) : null,
        diastolicBP: form.diastolicBP ? parseInt(form.diastolicBP) : null,
        heartRate: form.heartRate ? parseInt(form.heartRate) : null,
        glucose: form.glucose ? parseFloat(form.glucose) : null,
        glucoseUnit: form.glucoseUnit,
        stressLevel: form.stressLevel ? parseInt(form.stressLevel) : null,
        temperature: form.temperature ? parseFloat(form.temperature) : null,
        temperatureUnit: form.temperatureUnit,
        oxygenSaturation: form.oxygenSaturation ? parseInt(form.oxygenSaturation) : null,
        weight: form.weight ? parseFloat(form.weight) : null,
        weightUnit: form.weightUnit,
        notes: form.notes,
      };

      await vitalsService.create(vitalData);
      Alert.alert('Success', 'Vital signs recorded successfully');
      setShowAddForm(false);
      setForm({
        systolicBP: '',
        diastolicBP: '',
        heartRate: '',
        glucose: '',
        glucoseUnit: 'mg/dL',
        stressLevel: '',
        temperature: '',
        temperatureUnit: 'Celsius',
        oxygenSaturation: '',
        weight: '',
        weightUnit: 'kg',
        notes: '',
      });
      loadData();
    } catch (err) {
      Alert.alert('Error', 'Failed to save vital signs');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'NORMAL': return COLORS.success;
      case 'ELEVATED': return COLORS.warning;
      case 'HIGH':
      case 'HIGH_STAGE_1':
      case 'HIGH_STAGE_2': return COLORS.danger;
      case 'LOW': return COLORS.info;
      default: return COLORS.textSecondary;
    }
  };

  const renderVitalCard = (title, value, unit, status, icon, normalRange) => (
    <View style={styles.vitalCard}>
      <View style={styles.vitalHeader}>
        <Text style={styles.vitalIcon}>{icon}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
            {status?.replace('_', ' ')}
          </Text>
        </View>
      </View>
      <Text style={styles.vitalValue}>
        {value || '--'} <Text style={styles.vitalUnit}>{unit}</Text>
      </Text>
      <Text style={styles.vitalTitle}>{title}</Text>
      <Text style={styles.normalRange}>Normal: {normalRange}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header
        title="My Vitals"
        subtitle="Track your health metrics"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadData} />
        }
      >
        {/* Latest Vitals Summary */}
        {latestVitals && !showAddForm && (
          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Latest Readings</Text>
            <Text style={styles.lastUpdated}>
              Last updated: {new Date(latestVitals.recordedAt).toLocaleString()}
            </Text>
            
            <View style={styles.vitalsGrid}>
              {renderVitalCard(
                'Blood Pressure',
                latestVitals.systolicBP && `${latestVitals.systolicBP}/${latestVitals.diastolicBP}`,
                'mmHg',
                latestVitals.systolicBP > 140 ? 'HIGH' : 'NORMAL',
                '🫀',
                '120/80'
              )}
              {renderVitalCard(
                'Heart Rate',
                latestVitals.heartRate,
                'bpm',
                latestVitals.heartRate > 100 ? 'HIGH' : latestVitals.heartRate < 60 ? 'LOW' : 'NORMAL',
                '💓',
                '60-100'
              )}
              {renderVitalCard(
                'Blood Glucose',
                latestVitals.glucose,
                latestVitals.glucoseUnit,
                latestVitals.glucose > 140 ? 'HIGH' : 'NORMAL',
                '🩸',
                '70-100'
              )}
              {renderVitalCard(
                'Stress Level',
                latestVitals.stressLevel,
                '/10',
                latestVitals.stressLevel > 7 ? 'HIGH' : latestVitals.stressLevel > 4 ? 'ELEVATED' : 'NORMAL',
                '🧘',
                '1-3'
              )}
            </View>
          </View>
        )}

        {/* Add New Vitals Form */}
        {showAddForm ? (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Add New Reading</Text>
            
            <View style={styles.formRow}>
              <View style={styles.formField}>
                <Text style={styles.label}>Systolic BP</Text>
                <TextInput
                  style={styles.input}
                  placeholder="120"
                  keyboardType="numeric"
                  value={form.systolicBP}
                  onChangeText={(v) => setForm({ ...form, systolicBP: v })}
                />
              </View>
              <View style={styles.formField}>
                <Text style={styles.label}>Diastolic BP</Text>
                <TextInput
                  style={styles.input}
                  placeholder="80"
                  keyboardType="numeric"
                  value={form.diastolicBP}
                  onChangeText={(v) => setForm({ ...form, diastolicBP: v })}
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formField}>
                <Text style={styles.label}>Heart Rate (bpm)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="72"
                  keyboardType="numeric"
                  value={form.heartRate}
                  onChangeText={(v) => setForm({ ...form, heartRate: v })}
                />
              </View>
              <View style={styles.formField}>
                <Text style={styles.label}>Glucose (mg/dL)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="90"
                  keyboardType="numeric"
                  value={form.glucose}
                  onChangeText={(v) => setForm({ ...form, glucose: v })}
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formField}>
                <Text style={styles.label}>Stress Level (1-10)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="3"
                  keyboardType="numeric"
                  value={form.stressLevel}
                  onChangeText={(v) => setForm({ ...form, stressLevel: v })}
                />
              </View>
              <View style={styles.formField}>
                <Text style={styles.label}>Oxygen Sat (%)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="98"
                  keyboardType="numeric"
                  value={form.oxygenSaturation}
                  onChangeText={(v) => setForm({ ...form, oxygenSaturation: v })}
                />
              </View>
            </View>

            <View style={styles.formField}>
              <Text style={styles.label}>Notes (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="How are you feeling?"
                multiline
                numberOfLines={3}
                value={form.notes}
                onChangeText={(v) => setForm({ ...form, notes: v })}
              />
            </View>

            <View style={styles.formActions}>
              <CustomButton
                title="Cancel"
                variant="outline"
                onPress={() => setShowAddForm(false)}
                style={styles.cancelBtn}
              />
              <CustomButton
                title="Save Reading"
                onPress={handleSubmit}
                style={styles.saveBtn}
              />
            </View>
          </View>
        ) : (
          <CustomButton
            title="+ Add New Reading"
            onPress={() => setShowAddForm(true)}
            style={styles.addBtn}
          />
        )}

        {/* History Section */}
        {!showAddForm && vitals.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>History</Text>
            {vitals.slice(0, 10).map((vital, index) => (
              <View key={index} style={styles.historyItem}>
                <View style={styles.historyLeft}>
                  <Text style={styles.historyDate}>
                    {new Date(vital.recordedAt).toLocaleDateString()}
                  </Text>
                  <Text style={styles.historyTime}>
                    {new Date(vital.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <View style={styles.historyValues}>
                  {vital.systolicBP && (
                    <Text style={styles.historyValue}>BP: {vital.systolicBP}/{vital.diastolicBP}</Text>
                  )}
                  {vital.heartRate && (
                    <Text style={styles.historyValue}>HR: {vital.heartRate} bpm</Text>
                  )}
                  {vital.glucose && (
                    <Text style={styles.historyValue}>Glucose: {vital.glucose}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxxl,
  },
  summarySection: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  lastUpdated: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  vitalCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    width: '47%',
    ...SHADOW.card,
  },
  vitalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  vitalIcon: {
    fontSize: 24,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  vitalValue: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  vitalUnit: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  vitalTitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  normalRange: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    fontSize: 11,
  },
  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    margin: SPACING.lg,
    ...SHADOW.card,
  },
  formTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  formRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  formField: {
    flex: 1,
  },
  label: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 16,
    backgroundColor: COLORS.background,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  cancelBtn: {
    flex: 1,
  },
  saveBtn: {
    flex: 2,
  },
  addBtn: {
    margin: SPACING.lg,
  },
  historySection: {
    padding: SPACING.lg,
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOW.card,
  },
  historyLeft: {
    marginRight: SPACING.md,
    minWidth: 70,
  },
  historyDate: {
    ...TYPOGRAPHY.label,
    color: COLORS.textPrimary,
  },
  historyTime: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  historyValues: {
    flex: 1,
  },
  historyValue: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
});

export default VitalsScreen;
