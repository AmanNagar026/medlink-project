import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Animated,
  Easing,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import vitalsService from '../../services/vitalsService';
import COLORS from '../../utils/colors';
import { SPACING, RADIUS, SHADOW } from '../../utils/theme';

const initialForm = {
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
};

const statusColor = (status) => {
  switch (status) {
    case 'HIGH':
    case 'HIGH_STAGE_1':
    case 'HIGH_STAGE_2':
      return '#dc2626';
    case 'ELEVATED':
      return '#d97706';
    case 'LOW':
      return '#2563eb';
    case 'NORMAL':
    default:
      return '#059669';
  }
};

const VitalsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1200;
  const isTablet = width >= 760;

  const [vitals, setVitals] = useState([]);
  const [latestVitals, setLatestVitals] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(initialForm);

  const entranceAnim = useRef(new Animated.Value(0)).current;

  const patientId = user?.profileId || user?.id || user?.userId;

  const loadData = useCallback(async () => {
    if (!patientId) {
      setRefreshing(false);
      return;
    }

    try {
      const [allVitals, latest] = await Promise.all([
        vitalsService.getByPatient(patientId),
        vitalsService.getLatest(patientId).catch(() => null),
      ]);
      setVitals(allVitals || []);
      setLatestVitals(latest);
    } catch (err) {
      console.error('Error loading vitals:', err);
    } finally {
      setRefreshing(false);
    }
  }, [patientId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      const interval = setInterval(loadData, 30000);
      return () => clearInterval(interval);
    }, [loadData])
  );

  useEffect(() => {
    Animated.timing(entranceAnim, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entranceAnim, showAddForm]);

  const cards = useMemo(() => {
    if (!latestVitals) return [];

    const bp = latestVitals.systolicBP && latestVitals.diastolicBP
      ? `${latestVitals.systolicBP}/${latestVitals.diastolicBP}`
      : '--';

    return [
      {
        title: 'Blood Pressure',
        icon: 'fitness',
        value: bp,
        unit: 'mmHg',
        status: latestVitals.systolicBP > 140 ? 'HIGH' : 'NORMAL',
      },
      {
        title: 'Heart Rate',
        icon: 'heart',
        value: latestVitals.heartRate || '--',
        unit: 'bpm',
        status:
          latestVitals.heartRate > 100
            ? 'HIGH'
            : latestVitals.heartRate < 60
            ? 'LOW'
            : 'NORMAL',
      },
      {
        title: 'Glucose',
        icon: 'water',
        value: latestVitals.glucose || '--',
        unit: latestVitals.glucoseUnit || 'mg/dL',
        status: latestVitals.glucose > 140 ? 'HIGH' : 'NORMAL',
      },
      {
        title: 'Oxygen',
        icon: 'leaf',
        value: latestVitals.oxygenSaturation || '--',
        unit: '%',
        status: latestVitals.oxygenSaturation < 95 ? 'LOW' : 'NORMAL',
      },
    ];
  }, [latestVitals]);

  const handleSubmit = async () => {
    if (!patientId) {
      Alert.alert('Profile Error', 'Patient profile not found. Please login again.');
      return;
    }

    const hasAtLeastOneMetric =
      form.systolicBP ||
      form.diastolicBP ||
      form.heartRate ||
      form.glucose ||
      form.stressLevel ||
      form.temperature ||
      form.oxygenSaturation ||
      form.weight;

    if (!hasAtLeastOneMetric) {
      Alert.alert('Missing data', 'Please enter at least one vital metric.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        patientId,
        patientName: user?.name || 'Patient',
        systolicBP: form.systolicBP ? parseInt(form.systolicBP, 10) : null,
        diastolicBP: form.diastolicBP ? parseInt(form.diastolicBP, 10) : null,
        heartRate: form.heartRate ? parseInt(form.heartRate, 10) : null,
        glucose: form.glucose ? parseFloat(form.glucose) : null,
        glucoseUnit: form.glucoseUnit,
        stressLevel: form.stressLevel ? parseInt(form.stressLevel, 10) : null,
        temperature: form.temperature ? parseFloat(form.temperature) : null,
        temperatureUnit: form.temperatureUnit,
        oxygenSaturation: form.oxygenSaturation ? parseInt(form.oxygenSaturation, 10) : null,
        weight: form.weight ? parseFloat(form.weight) : null,
        weightUnit: form.weightUnit,
        notes: form.notes,
      };

      await vitalsService.create(payload);
      setForm(initialForm);
      setShowAddForm(false);
      await loadData();
      Alert.alert('Saved', 'Vitals recorded successfully.');
    } catch (err) {
      console.error('Vitals submit error:', err);
      Alert.alert('Error', 'Failed to save vital signs.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (label, key, placeholder, keyboardType = 'numeric') => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        keyboardType={keyboardType}
        value={form[key]}
        onChangeText={(v) => setForm((prev) => ({ ...prev, [key]: v }))}
        placeholderTextColor={COLORS.textLight}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="My Vitals" subtitle="Track and log health metrics" onBack={() => navigation.goBack()} />

      <Animated.ScrollView
        style={{
          opacity: entranceAnim,
          transform: [
            {
              translateY: entranceAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [8, 0],
              }),
            },
          ],
        }}
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
        {latestVitals && (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Latest Readings</Text>
              <Text style={styles.lastUpdated}>
                {new Date(latestVitals.recordedAt).toLocaleString()}
              </Text>
            </View>

            <View style={styles.grid}>
              {cards.map((card) => (
                <Pressable
                  key={card.title}
                  style={({ hovered, pressed }) => [
                    styles.vitalCard,
                    isDesktop && styles.vitalCardDesktop,
                    isTablet && !isDesktop && styles.vitalCardTablet,
                    !isTablet && styles.vitalCardMobile,
                    hovered && styles.vitalCardHover,
                    pressed && styles.vitalCardPressed,
                  ]}
                >
                  <View style={styles.vitalCardTop}>
                    <View style={styles.vitalIconWrap}>
                      <Ionicons name={card.icon} size={18} color={COLORS.primary} />
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: `${statusColor(card.status)}22` }]}>
                      <Text style={[styles.statusPillText, { color: statusColor(card.status) }]}>{card.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.vitalValue}>{card.value}</Text>
                  <Text style={styles.vitalUnit}>{card.unit}</Text>
                  <Text style={styles.vitalTitle}>{card.title}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeadInline}>
            <Text style={styles.sectionTitle}>Log New Vitals</Text>
            <TouchableOpacity onPress={() => setShowAddForm((prev) => !prev)}>
              <Text style={styles.toggleText}>{showAddForm ? 'Close' : 'Add'}</Text>
            </TouchableOpacity>
          </View>

          {showAddForm ? (
            <View style={styles.formCard}>
              <View style={[styles.row, !isTablet && styles.rowStack]}>{renderField('Systolic BP', 'systolicBP', '120')}{renderField('Diastolic BP', 'diastolicBP', '80')}</View>
              <View style={[styles.row, !isTablet && styles.rowStack]}>{renderField('Heart Rate (bpm)', 'heartRate', '72')}{renderField('Glucose', 'glucose', '90')}</View>
              <View style={[styles.row, !isTablet && styles.rowStack]}>{renderField('Oxygen (%)', 'oxygenSaturation', '98')}{renderField('Stress (1-10)', 'stressLevel', '3')}</View>
              <View style={[styles.row, !isTablet && styles.rowStack]}>{renderField('Temperature', 'temperature', '36.8')}{renderField('Weight (kg)', 'weight', '70')}</View>

              <View style={styles.fieldSingle}>
                <Text style={styles.label}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Optional note"
                  value={form.notes}
                  onChangeText={(v) => setForm((prev) => ({ ...prev, notes: v }))}
                  placeholderTextColor={COLORS.textLight}
                  multiline
                />
              </View>

              <View style={[styles.actionsRow, !isTablet && styles.actionsColumn]}>
                <Pressable style={({ hovered, pressed }) => [styles.cancelBtn, hovered && styles.cancelBtnHover, pressed && styles.cancelBtnPress]} onPress={() => setShowAddForm(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable style={({ hovered, pressed }) => [styles.saveBtn, hovered && styles.saveBtnHover, pressed && styles.saveBtnPress]} onPress={handleSubmit} disabled={submitting}>
                  <Text style={styles.saveBtnText}>{submitting ? 'Saving...' : 'Save Reading'}</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable style={({ hovered, pressed }) => [styles.addBtn, hovered && styles.addBtnHover, pressed && styles.addBtnPress]} onPress={() => setShowAddForm(true)}>
              <Ionicons name="add-circle-outline" size={20} color={COLORS.white} />
              <Text style={styles.addBtnText}>Add New Reading</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent History</Text>
          {vitals.length === 0 ? (
            <Text style={styles.emptyText}>No vitals recorded yet.</Text>
          ) : (
            vitals.slice(0, 10).map((vital, idx) => (
              <Pressable key={vital.id || idx} style={({ hovered }) => [styles.historyItem, !isTablet && styles.historyItemStack, hovered && styles.historyItemHover]}>
                <View>
                  <Text style={styles.historyDate}>{new Date(vital.recordedAt).toLocaleDateString()}</Text>
                  <Text style={styles.historyTime}>
                    {new Date(vital.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <View style={[styles.historyMetrics, !isTablet && styles.historyMetricsLeft]}>
                  {vital.systolicBP ? <Text style={styles.historyMetric}>BP {vital.systolicBP}/{vital.diastolicBP}</Text> : null}
                  {vital.heartRate ? <Text style={styles.historyMetric}>HR {vital.heartRate}</Text> : null}
                  {vital.glucose ? <Text style={styles.historyMetric}>GLU {vital.glucose}</Text> : null}
                </View>
              </Pressable>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f6fb',
  },
  scrollContent: {
    padding: SPACING.lg,
    gap: SPACING.lg,
    paddingBottom: 42,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOW.card,
  },
  sectionHead: {
    marginBottom: SPACING.md,
  },
  sectionHeadInline: {
    marginBottom: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  lastUpdated: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  vitalCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#e4ebf3',
    backgroundColor: '#f8fbff',
  },
  vitalCardDesktop: {
    width: '23.5%',
  },
  vitalCardTablet: {
    width: '48%',
  },
  vitalCardMobile: {
    width: '100%',
  },
  vitalCardHover: {
    borderColor: '#bcd8ef',
    backgroundColor: '#f3f9ff',
  },
  vitalCardPressed: {
    transform: [{ scale: 0.99 }],
  },
  vitalCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  vitalIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ddf4ef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  vitalValue: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 32,
  },
  vitalUnit: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  vitalTitle: {
    marginTop: 6,
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  toggleText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  formCard: {
    borderWidth: 1,
    borderColor: '#e7edf5',
    borderRadius: RADIUS.lg,
    backgroundColor: '#f8fbff',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  rowStack: {
    flexDirection: 'column',
  },
  field: {
    flex: 1,
  },
  fieldSingle: {
    marginTop: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 5,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  textArea: {
    minHeight: 76,
    textAlignVertical: 'top',
  },
  actionsRow: {
    marginTop: 8,
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionsColumn: {
    flexDirection: 'column',
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d9e1ea',
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    backgroundColor: '#fff',
  },
  cancelBtnHover: {
    backgroundColor: '#f5f8fb',
  },
  cancelBtnPress: {
    transform: [{ scale: 0.99 }],
  },
  cancelBtnText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 1.3,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    backgroundColor: COLORS.primary,
  },
  saveBtnHover: {
    backgroundColor: COLORS.primaryDark,
  },
  saveBtnPress: {
    transform: [{ scale: 0.99 }],
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  addBtn: {
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  addBtnHover: {
    backgroundColor: COLORS.primaryDark,
  },
  addBtnPress: {
    transform: [{ scale: 0.99 }],
  },
  addBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  historyItem: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e8eef5',
    borderRadius: RADIUS.lg,
    backgroundColor: '#f8fbff',
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyItemStack: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
  },
  historyItemHover: {
    backgroundColor: '#f3f8fe',
    borderColor: '#cddfed',
  },
  historyDate: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  historyTime: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  historyMetrics: {
    alignItems: 'flex-end',
    gap: 1,
  },
  historyMetricsLeft: {
    alignItems: 'flex-start',
  },
  historyMetric: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});

export default VitalsScreen;
