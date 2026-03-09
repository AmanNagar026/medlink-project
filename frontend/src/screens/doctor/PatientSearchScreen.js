import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Header from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import CustomButton from '../../components/CustomButton';
import patientService from '../../services/patientService';
import prescriptionService from '../../services/prescriptionService';
import medicationService from '../../services/medicationService';
import vitalsService from '../../services/vitalsService';
import COLORS from '../../utils/colors';
import { SPACING, TYPOGRAPHY, RADIUS, SHADOW } from '../../utils/theme';

const DEBOUNCE_MS = 400;

const PatientSearchScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientDetails, setPatientDetails] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [intakeHistory, setIntakeHistory] = useState([]);
  const [vitals, setVitals] = useState([]);
  const [adherence, setAdherence] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const debounceRef = useRef(null);

  const getPatientId = (p) => p?.id ?? p?._id ?? '';

  const loadAllPatients = useCallback(async () => {
    if (!user?.profileId) return;
    try {
      const data = await patientService.getByDoctor(user.profileId);
      setPatients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading patients:', err);
    }
  }, [user?.profileId]);

  const performSearch = useCallback(async (query) => {
    if (!user?.profileId) return;
    if (!query.trim()) {
      await loadAllPatients();
      return;
    }
    try {
      setSearching(true);
      const results = await patientService.search(user.profileId, query.trim());
      setPatients(Array.isArray(results) ? results : []);
    } catch (err) {
      console.error('Error searching patients:', err);
      Alert.alert('Search Error', 'Failed to search patients. Please try again.');
    } finally {
      setSearching(false);
    }
  }, [user?.profileId]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchQuery.trim()) {
      loadAllPatients();
      return;
    }
    debounceRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, loadAllPatients, performSearch]);

  useFocusEffect(useCallback(() => {
    loadAllPatients();
  }, [user?.profileId]));

  const handleSearch = () => {
    performSearch(searchQuery);
  };

  const loadPatientDetails = async (patient) => {
    const pid = getPatientId(patient);
    if (!pid) return;
    setSelectedPatient(patient);
    setLoading(true);
    setAdherence(null);
    try {
      const [details, rxHistory, intakes, vitalData, adherenceData] = await Promise.all([
        patientService.getById(pid),
        prescriptionService.getByPatient(pid).catch(() => []),
        medicationService.getIntakeHistory(pid).catch(() => []),
        vitalsService.getByPatient(pid).catch(() => []),
        medicationService.getAdherence(pid).catch(() => null),
      ]);
      setPatientDetails(details);
      setPrescriptions(Array.isArray(rxHistory) ? rxHistory : []);
      setIntakeHistory(Array.isArray(intakes) ? intakes : []);
      setVitals(Array.isArray(vitalData) ? vitalData : []);
      setAdherence(adherenceData);
    } catch (err) {
      Alert.alert('Error', 'Failed to load patient details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return COLORS.success;
      case 'EXPIRING_SOON': return COLORS.warning;
      case 'COMPLETED': return COLORS.info;
      case 'EXPIRED': return COLORS.danger;
      case 'TAKEN': return COLORS.success;
      case 'MISSED': return COLORS.danger;
      case 'PENDING': return COLORS.warning;
      default: return COLORS.textSecondary;
    }
  };

  const computeRxStatus = (rx) => {
    if (rx.status === 'COMPLETED') return 'COMPLETED';
    if (!rx.expiryDate) return 'ACTIVE';
    const today = new Date();
    const expiry = new Date(rx.expiryDate);
    const daysUntil = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    if (daysUntil < 0) return 'EXPIRED';
    if (daysUntil <= 7) return 'EXPIRING_SOON';
    return 'ACTIVE';
  };

  const renderPatientList = () => (
    <View style={styles.listSection}>
      <Text style={styles.sectionTitle}>Patients ({patients.length})</Text>
      {searching && (
        <View style={styles.searchingRow}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.searchingText}>Searching...</Text>
        </View>
      )}
      {patients.map((patient) => (
        <TouchableOpacity
          key={getPatientId(patient)}
          style={[
            styles.patientCard,
            getPatientId(selectedPatient) === getPatientId(patient) && styles.patientCardSelected,
          ]}
          onPress={() => loadPatientDetails(patient)}
        >
          <View style={styles.patientAvatar}>
            <Text style={styles.patientAvatarText}>
              {patient.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </Text>
          </View>
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>{patient.name}</Text>
            <Text style={styles.patientEmail}>{patient.email}</Text>
            <Text style={styles.patientPhone}>{patient.phoneNumber || 'No phone'}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPatientDetails = () => {
    if (!selectedPatient) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👤</Text>
          <Text style={styles.emptyTitle}>Select a Patient</Text>
          <Text style={styles.emptyText}>Choose a patient from the list to view their details</Text>
        </View>
      );
    }

    return (
      <View style={styles.detailsSection}>
        {/* Patient Header */}
        <View style={styles.detailsHeader}>
          <View style={styles.detailsAvatar}>
            <Text style={styles.detailsAvatarText}>
              {selectedPatient.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </Text>
          </View>
          <View style={styles.detailsInfo}>
            <Text style={styles.detailsName}>{selectedPatient.name}</Text>
            <Text style={styles.detailsMeta}>Patient ID: {getPatientId(selectedPatient)}</Text>
            <Text style={styles.detailsMeta}>{selectedPatient.email}</Text>
            <Text style={styles.detailsMeta}>{selectedPatient.phoneNumber}</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {['details', 'prescriptions', 'history', 'vitals'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'details' && renderDetailsTab()}
        {activeTab === 'prescriptions' && renderPrescriptionsTab()}
        {activeTab === 'history' && renderHistoryTab()}
        {activeTab === 'vitals' && renderVitalsTab()}
      </View>
    );
  };

  const renderDetailsTab = () => (
    <View style={styles.tabContent}>
      {adherence != null && (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Adherence</Text>
          <View style={styles.adherenceRow}>
            <Text style={styles.infoLabel}>Medication Adherence</Text>
            <Text style={[styles.adherenceValue, { color: (adherence.adherenceRate || 0) >= 80 ? '#16a34a' : (adherence.adherenceRate || 0) >= 50 ? '#d97706' : '#dc2626' }]}>
              {adherence.adherenceRate ?? 0}%
            </Text>
          </View>
          {(adherence.taken != null || adherence.total != null) && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Taken / Total</Text>
              <Text style={styles.infoValue}>{adherence.taken ?? 0} / {adherence.total ?? 0}</Text>
            </View>
          )}
        </View>
      )}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Personal Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date of Birth</Text>
          <Text style={styles.infoValue}>
            {patientDetails?.dateOfBirth ? new Date(patientDetails.dateOfBirth).toLocaleDateString() : 'Not provided'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Gender</Text>
          <Text style={styles.infoValue}>{patientDetails?.gender || 'Not provided'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Blood Group</Text>
          <Text style={styles.infoValue}>{patientDetails?.bloodGroup || 'Not provided'}</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Medical Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Allergies</Text>
          <Text style={styles.infoValue}>
            {patientDetails?.allergies?.length > 0 ? patientDetails.allergies.join(', ') : 'None recorded'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Chronic Conditions</Text>
          <Text style={styles.infoValue}>
            {patientDetails?.chronicConditions?.length > 0 ? patientDetails.chronicConditions.join(', ') : 'None recorded'}
          </Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Emergency Contact</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Name</Text>
          <Text style={styles.infoValue}>{patientDetails?.emergencyContactName || 'Not provided'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone</Text>
          <Text style={styles.infoValue}>{patientDetails?.emergencyContactPhone || 'Not provided'}</Text>
        </View>
      </View>

      <CustomButton
        title="Create Prescription"
        onPress={() => navigation.navigate('CreatePrescription', { patientId: getPatientId(selectedPatient) })}
        style={styles.actionBtn}
      />
    </View>
  );

  const renderPrescriptionsTab = () => {
    const withStatus = prescriptions.map((rx) => ({ ...rx, computedStatus: computeRxStatus(rx) }));
    const active = withStatus.filter((r) => r.computedStatus === 'ACTIVE');
    const expiringSoon = withStatus.filter((r) => r.computedStatus === 'EXPIRING_SOON');
    const completed = withStatus.filter((r) => r.computedStatus === 'COMPLETED');
    const expired = withStatus.filter((r) => r.computedStatus === 'EXPIRED');

    const renderRxList = (list, groupLabel) =>
      list.length > 0 && (
        <>
          <Text style={styles.rxGroupLabel}>{groupLabel} ({list.length})</Text>
          {list.map((rx, index) => (
            <View key={rx.id || index} style={styles.rxCard}>
              <View style={styles.rxHeader}>
                <Text style={styles.rxDate}>
                  {new Date(rx.prescribedDate || rx.createdAt).toLocaleDateString()}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(rx.computedStatus || rx.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(rx.computedStatus || rx.status) }]}>
                    {rx.computedStatus || rx.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.rxDiagnosis}>{rx.diagnosis || 'No diagnosis'}</Text>
              {rx.notes && <Text style={styles.rxNotes}>{rx.notes}</Text>}
              <View style={styles.rxMeds}>
                {rx.medications?.map((med, i) => (
                  <Text key={i} style={styles.rxMed}>
                    • {med.medicationName} - {med.dosage} ({med.frequency})
                  </Text>
                ))}
              </View>
            </View>
          ))}
        </>
      );

    return (
      <View style={styles.tabContent}>
        <Text style={styles.tabSubtitle}>Prescriptions ({prescriptions.length})</Text>
        {prescriptions.length === 0 ? (
          <Text style={styles.emptyTabText}>No prescriptions found</Text>
        ) : (
          <>
            {renderRxList(active, 'Active')}
            {renderRxList(expiringSoon, 'Expiring Soon')}
            {renderRxList(completed, 'Completed')}
            {renderRxList(expired, 'Expired')}
          </>
        )}
      </View>
    );
  };

  const renderHistoryTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabSubtitle}>Medication Intake History ({intakeHistory.length})</Text>
      {intakeHistory.length === 0 ? (
        <Text style={styles.emptyTabText}>No intake records found</Text>
      ) : (
        intakeHistory.slice(0, 20).map((log, index) => (
          <View key={index} style={styles.historyItem}>
            <View style={styles.historyLeft}>
              <Text style={styles.historyDate}>
                {new Date(log.scheduledDate).toLocaleDateString()}
              </Text>
              <Text style={styles.historyTime}>
                {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <View style={styles.historyCenter}>
              <Text style={styles.historyMed}>{log.medicationName}</Text>
              <Text style={styles.historyDosage}>{log.dosage}</Text>
            </View>
            <View style={[styles.historyStatus, { backgroundColor: getStatusColor(log.status) + '20' }]}>
              <Text style={[styles.historyStatusText, { color: getStatusColor(log.status) }]}>
                {log.status}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderVitalsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabSubtitle}>Vital Signs History ({vitals.length})</Text>
      {vitals.length === 0 ? (
        <Text style={styles.emptyTabText}>No vital signs recorded</Text>
      ) : (
        vitals.slice(0, 10).map((vital, index) => (
          <View key={index} style={styles.vitalCard}>
            <View style={styles.vitalHeader}>
              <Text style={styles.vitalDate}>
                {new Date(vital.recordedAt).toLocaleString()}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(vital.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(vital.status) }]}>
                  {vital.status}
                </Text>
              </View>
            </View>
            <View style={styles.vitalValues}>
              {vital.systolicBP && (
                <Text style={styles.vitalValue}>BP: {vital.systolicBP}/{vital.diastolicBP}</Text>
              )}
              {vital.heartRate && (
                <Text style={styles.vitalValue}>HR: {vital.heartRate} bpm</Text>
              )}
              {vital.glucose && (
                <Text style={styles.vitalValue}>Glucose: {vital.glucose} {vital.glucoseUnit}</Text>
              )}
              {vital.stressLevel && (
                <Text style={styles.vitalValue}>Stress: {vital.stressLevel}/10</Text>
              )}
            </View>
            {vital.notes && <Text style={styles.vitalNotes}>{vital.notes}</Text>}
          </View>
        ))
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Header
        title="Patient Search"
        subtitle="Find and view patient records"
        onBack={() => navigation.goBack()}
      />

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, ID, email, phone, or condition..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
            <Text style={styles.searchBtnText}>🔍</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mainContent}>
          {/* Patient List */}
          <ScrollView style={styles.listContainer} refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadAllPatients} />
          }>
            {renderPatientList()}
          </ScrollView>

          {/* Patient Details */}
          <ScrollView style={styles.detailsContainer}>
            {renderPatientDetails()}
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.md,
  },
  searchBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnText: {
    fontSize: 20,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  listContainer: {
    flex: 1,
    maxWidth: 350,
  },
  detailsContainer: {
    flex: 2,
  },
  listSection: {},
  searchingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  searchingText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
  },
  sectionTitle: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  patientCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight + '10',
  },
  patientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  patientAvatarText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    ...TYPOGRAPHY.label,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  patientEmail: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  patientPhone: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    fontSize: 11,
  },
  chevron: {
    fontSize: 24,
    color: COLORS.textLight,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  detailsSection: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOW.card,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailsAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  detailsAvatarText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '700',
  },
  detailsInfo: {
    flex: 1,
  },
  detailsName: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  detailsMeta: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginRight: SPACING.sm,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  tabContent: {},
  tabSubtitle: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  emptyTabText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textLight,
    textAlign: 'center',
    paddingVertical: SPACING.xl,
  },
  infoCard: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  infoTitle: {
    ...TYPOGRAPHY.label,
    color: COLORS.primary,
    marginBottom: SPACING.md,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  adherenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  adherenceValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  rxGroupLabel: {
    ...TYPOGRAPHY.label,
    color: COLORS.primary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  infoLabel: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  infoValue: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textPrimary,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    marginLeft: SPACING.md,
  },
  actionBtn: {
    marginTop: SPACING.md,
  },
  rxCard: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  rxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  rxDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
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
  rxDiagnosis: {
    ...TYPOGRAPHY.label,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  rxNotes: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  rxMeds: {},
  rxMed: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textPrimary,
    fontSize: 12,
    marginBottom: 2,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  historyLeft: {
    marginRight: SPACING.md,
    minWidth: 70,
  },
  historyDate: {
    ...TYPOGRAPHY.label,
    color: COLORS.textPrimary,
    fontSize: 12,
  },
  historyTime: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  historyCenter: {
    flex: 1,
  },
  historyMed: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textPrimary,
  },
  historyDosage: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  historyStatus: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  historyStatusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  vitalCard: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  vitalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  vitalDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  vitalValues: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  vitalValue: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  vitalNotes: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    fontStyle: 'italic',
  },
});

export default PatientSearchScreen;
