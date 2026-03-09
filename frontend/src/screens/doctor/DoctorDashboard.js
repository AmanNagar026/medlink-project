import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Modal,
  Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import ECGLogo from '../../components/ECGLogo';
import prescriptionService from '../../services/prescriptionService';
import { api } from '../../services/api';
import DashboardStatsGrid from '../../components/DashboardStatsGrid';
import PatientInsightsSection from '../../components/PatientInsightsSection';
import { usePatientSync } from '../../hooks/usePatientSync';
import { useTheme } from '../../context/ThemeContext';
import COLORS from '../../utils/colors';
import { SPACING, SHADOW } from '../../utils/theme';

const { width } = Dimensions.get('window');

const DoctorDashboard = ({ navigation, route }) => {
  const { user, logout } = useAuth();
  const { colors, mode, toggleTheme } = useTheme();
  const doctorId = user?.profileId;
  const doctorName = user?.name?.split(' ')[0] || 'Doctor';
  
  // Use the new patient sync hook for real-time updates
  const {
    patients,
    stats: dashboardStats,
    loading: dataLoading,
    error: dataError,
    refreshAll,
    addPatient,
  } = usePatientSync(doctorId, {
    enablePolling: true,
    pollingInterval: 30000, // 30 seconds
    onPatientAdded: (newPatient) => {
      showBanner(`${newPatient.name} has been added successfully!`);
    }
  });
  
  const [prescriptions, setPrescriptions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const bannerAnim = useState(new Animated.Value(0))[0];

  // Show success banner
  const showBanner = (msg) => {
    setSuccessMsg(msg);
    bannerAnim.setValue(0);
    Animated.sequence([
      Animated.timing(bannerAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(3000),
      Animated.timing(bannerAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setSuccessMsg(''));
  };

  // Load prescription data (keeping existing logic for prescriptions)
  const loadPrescriptionData = async () => {
    if (!doctorId) {
      setError('Doctor ID not found');
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const rxData = await prescriptionService.getByDoctor(doctorId).catch(() => []);
      
      // Process prescriptions with calculated status
      const processedRx = (rxData || []).map(rx => ({
        ...rx,
        computedStatus: computePrescriptionStatus(rx),
      }));
      
      setPrescriptions(processedRx);
    } catch (err) {
      console.error('Prescription load error:', err);
      setError('Failed to load prescription data');
    } finally {
      setLoading(false);
    }
  };

  // Load all data using the new hook
  const loadData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshAll(), // This will refresh patients and stats
        loadPrescriptionData()
      ]);
    } catch (err) {
      console.error('Dashboard load error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setRefreshing(false);
    }
  };

  // Compute prescription status based on expiry date
  const computePrescriptionStatus = (rx) => {
    if (!rx.expiryDate) return rx.status || 'ACTIVE';
    const today = new Date();
    const expiry = new Date(rx.expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    
    if (rx.status === 'COMPLETED') return 'COMPLETED';
    if (daysUntilExpiry < 0) return 'EXPIRED';
    if (daysUntilExpiry <= 7) return 'EXPIRING_SOON';
    return 'ACTIVE';
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
      
      // Handle success messages from other screens
      const msg = route?.params?.successMsg;
      const newPatient = route?.params?.newPatient;
      
      if (newPatient) {
        // Add patient to local state immediately for instant feedback
        // The usePatientSync hook will handle the actual data refresh
        showBanner(`${newPatient.name} has been added successfully!`);
        
        // Trigger immediate refresh to ensure data consistency
        refreshAll();
        
        // Clear the navigation params
        navigation.setParams({ successMsg: undefined, newPatient: undefined });
      } else if (msg) {
        showBanner(msg);
        navigation.setParams({ successMsg: undefined });
      }
    }, [doctorId, route?.params?.successMsg, route?.params?.newPatient, refreshAll])
  );

  // Quick actions
  const quickActions = [
    { icon: '➕', label: 'New Prescription', onPress: () => navigation.navigate('CreatePrescription'), color: '#0f766e' },
    { icon: '👤', label: 'Add Patient', onPress: () => navigation.navigate('AddPatient'), color: '#3b82f6' },
    { icon: '📋', label: 'All Patients', onPress: () => navigation.navigate('PatientList'), color: '#8b5cf6' },
    { icon: '🔍', label: 'Search', onPress: () => navigation.navigate('PatientSearch'), color: '#f59e0b' },
  ];

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'ACTIVE': return { bg: '#dcfce7', text: '#16a34a', label: 'Active' };
      case 'EXPIRING_SOON': return { bg: '#fef3c7', text: '#d97706', label: 'Expiring' };
      case 'EXPIRED': return { bg: '#fee2e2', text: '#dc2626', label: 'Expired' };
      case 'COMPLETED': return { bg: '#e0e7ff', text: '#4f46e5', label: 'Completed' };
      default: return { bg: '#f3f4f6', text: '#6b7280', label: status };
    }
  };

  const getGenderIcon = (gender) => {
    const g = (gender || '').toLowerCase();
    if (g === 'male') return '👨';
    if (g === 'female') return '👩';
    return '👤';
  };

  // Handle stat card press events
  const handleStatCardPress = (cardKey) => {
    switch (cardKey) {
      case 'totalPatients':
        navigation.navigate('PatientList');
        break;
      case 'activePrescriptions':
        // Could navigate to active prescriptions filter
        break;
      case 'completedPrescriptions':
        // Could navigate to completed prescriptions filter
        break;
      case 'expiringSoon':
        // Could navigate to expiring prescriptions filter
        break;
      default:
        break;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Profile Dropdown Modal */}
      <Modal visible={showDropdown} transparent animationType="fade" onRequestClose={() => setShowDropdown(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowDropdown(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.profileCard} onPress={() => {}}>
            <View style={styles.profileCardHeader}>
              <View style={styles.profileCardAvatar}>
                <Text style={styles.profileCardAvatarText}>{(user?.name || 'D').charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.profileCardInfo}>
                <Text style={styles.profileCardName}>{user?.name || 'Doctor'}</Text>
                <Text style={styles.profileCardEmail}>{user?.email || ''}</Text>
                <View style={styles.profileCardRoleBadge}>
                  <Text style={styles.profileCardRoleText}>Doctor</Text>
                </View>
              </View>
            </View>
            <View style={styles.profileCardDivider} />
            <TouchableOpacity style={styles.profileCardItem} onPress={() => { setShowDropdown(false); navigation.navigate('Profile'); }}>
              <Text style={styles.profileCardItemIcon}>✎</Text>
              <Text style={styles.profileCardItemText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileCardItem} onPress={() => { setShowDropdown(false); toggleTheme?.(); }}>
              <Text style={styles.profileCardItemIcon}>T</Text>
              <Text style={styles.profileCardItemText}>{mode === 'dark' ? 'Daylight Mode' : 'Dark Mode'}</Text>
            </TouchableOpacity>
            <View style={styles.profileCardDivider} />
            <TouchableOpacity style={styles.profileCardItem} onPress={() => { setShowDropdown(false); logout(); }}>
              <Text style={styles.profileCardItemIconLogout}>⇥</Text>
              <Text style={styles.profileCardItemTextLogout}>Logout</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Success Banner */}
      {successMsg !== '' && (
        <Animated.View style={[styles.successBanner, { opacity: bannerAnim, transform: [{ translateY: bannerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
          <Text style={styles.successBannerIcon}>✓</Text>
          <Text style={styles.successBannerText}>{successMsg}</Text>
        </Animated.View>
      )}

      {/* Header */}
      <LinearGradient colors={['#0f766e', '#115e59', '#134e4a']} style={styles.headerGradient}>
        <View style={styles.topNav}>
          <View style={styles.navLeft}>
            <ECGLogo size={32} />
            <Text style={styles.navTitle}>MedLink</Text>
          </View>
          <View style={styles.navCenter}>
            <Text style={[styles.navItemText, styles.navActive]}>Dashboard</Text>
          </View>
          <View style={styles.navRight}>
            <TouchableOpacity style={styles.notificationBtn} onPress={() => toggleTheme?.()}>
              <Text style={styles.notificationIcon}>{mode === 'dark' ? 'L' : 'D'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.notificationBtn}>
              <Text style={styles.notificationIcon}>🔔</Text>
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{dashboardStats.expiringSoon > 0 ? dashboardStats.expiringSoon : ''}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarBtn} onPress={() => setShowDropdown(!showDropdown)}>
              <View style={styles.navAvatar}>
                <Text style={styles.navAvatarText}>{doctorName.charAt(0).toUpperCase()}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Welcome, Dr. {doctorName}!</Text>
          <Text style={styles.heroSubtitle}>Manage your patients and prescriptions</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} colors={['#0f766e']} />}
      >
        {/* Error Banner */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerIcon}>⚠️</Text>
            <Text style={styles.errorBannerText}>{error}</Text>
            <TouchableOpacity onPress={loadData}><Text style={styles.errorBannerRetry}>Retry</Text></TouchableOpacity>
          </View>
        )}

        {/* Stats Cards */}
        <DashboardStatsGrid
          stats={dashboardStats}
          onCardPress={handleStatCardPress}
          loading={dataLoading}
          error={dataError}
          onRetry={loadData}
        />

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          {quickActions.map((action, index) => (
            <TouchableOpacity key={index} style={styles.quickActionCard} onPress={action.onPress} activeOpacity={0.8}>
              <View style={[styles.quickActionIconContainer, { backgroundColor: `${action.color}15` }]}>
                <Text style={[styles.quickActionIcon, { color: action.color }]}>{action.icon}</Text>
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Main Content Grid */}
        <View style={styles.mainGrid}>
          {/* Left Column - All Prescriptions */}
          <View style={styles.leftColumn}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>All Prescriptions</Text>
              <TouchableOpacity onPress={() => navigation.navigate('CreatePrescription')}>
                <Text style={styles.viewAllLink}>+ New ›</Text>
              </TouchableOpacity>
            </View>
            
            {prescriptions.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyText}>No prescriptions yet</Text>
                <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('CreatePrescription')}>
                  <Text style={styles.emptyBtnText}>Create First Prescription</Text>
                </TouchableOpacity>
              </View>
            ) : (
              prescriptions
                .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
                .map((rx, index) => {
                  const statusStyle = getStatusBadgeStyle(rx.computedStatus);
                  const meds = rx.medications || [];
                  return (
                    <TouchableOpacity key={rx.id || index} style={styles.prescriptionCard} onPress={() => navigation.navigate('CreatePrescription', { prescriptionId: rx.id, patientId: rx.patientId, patientName: rx.patientName })}>
                      <View style={styles.rxHeader}>
                        <View style={styles.rxAvatar}>
                          <Text style={styles.rxAvatarText}>{(rx.patientName || '?').charAt(0).toUpperCase()}</Text>
                        </View>
                        <View style={styles.rxInfo}>
                          <Text style={styles.rxPatientName}>{rx.patientName || 'Unknown'}</Text>
                          <Text style={styles.rxDate}>Expires: {rx.expiryDate ? new Date(rx.expiryDate).toLocaleDateString() : 'N/A'}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                          <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
                        </View>
                      </View>
                      <View style={styles.rxMeds}>
                        {meds.slice(0, 2).map((med, idx) => (
                          <View key={idx} style={styles.medTag}>
                            <Text style={styles.medTagText}>💊 {med.medicationName} {med.dosage}</Text>
                          </View>
                        ))}
                        {meds.length > 2 && <Text style={styles.moreMeds}>+{meds.length - 2} more</Text>}
                      </View>
                    </TouchableOpacity>
                  );
                })
            )}
          </View>

          {/* Right Column - Patient Insights */}
          <View style={styles.rightColumn}>
            <PatientInsightsSection
              patients={patients}
              prescriptions={prescriptions}
              onPressPatient={(patient) => navigation.navigate('PatientList')}
              loading={dataLoading}
              showViewAll={true}
              onViewAll={() => navigation.navigate('PatientList')}
              emptyMessage="No patients yet"
            />
          </View>
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreatePrescription')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f4' },
  
  // Success Banner
  successBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 1000,
    gap: 10,
  },
  successBannerIcon: { fontSize: 16, color: '#16a34a', fontWeight: '700' },
  successBannerText: { fontSize: 14, color: '#15803d', fontWeight: '500', flex: 1 },

  // Header
  headerGradient: { paddingTop: 8, paddingBottom: 24 },
  topNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  navLeft: { flexDirection: 'row', alignItems: 'center' },
  navTitle: { color: COLORS.white, fontSize: 18, fontWeight: '700', marginLeft: SPACING.sm },
  navCenter: { flexDirection: 'row', alignItems: 'center' },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  navItemText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '500' },
  navActive: { color: COLORS.white, fontWeight: '600' },
  notificationBtn: { position: 'relative', padding: SPACING.xs },
  notificationIcon: { fontSize: 20 },
  notificationBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#ef4444', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  notificationBadgeText: { color: COLORS.white, fontSize: 10, fontWeight: '700', paddingHorizontal: 4 },
  avatarBtn: { marginLeft: SPACING.sm },
  navAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center' },
  navAvatarText: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
  heroSection: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },
  heroTitle: { fontSize: 28, fontWeight: '700', color: COLORS.white, marginBottom: SPACING.xs },
  heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },

  // Profile Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 64, paddingRight: 16 },
  profileCard: { backgroundColor: COLORS.white, borderRadius: 16, minWidth: 240, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 20, elevation: 20, overflow: 'hidden' },
  profileCardHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  profileCardAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0f766e', justifyContent: 'center', alignItems: 'center' },
  profileCardAvatarText: { color: COLORS.white, fontSize: 18, fontWeight: '700' },
  profileCardInfo: { flex: 1 },
  profileCardName: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 2 },
  profileCardEmail: { fontSize: 12, color: '#64748b', marginBottom: 6 },
  profileCardRoleBadge: { alignSelf: 'flex-start', backgroundColor: '#f0fdf4', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: '#bbf7d0' },
  profileCardRoleText: { fontSize: 11, color: '#15803d', fontWeight: '600' },
  profileCardDivider: { height: 1, backgroundColor: '#f1f5f9' },
  profileCardItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 12 },
  profileCardItemIcon: { fontSize: 17, color: '#334155', width: 20, textAlign: 'center' },
  profileCardItemText: { fontSize: 15, color: '#334155', fontWeight: '500' },
  profileCardItemIconLogout: { fontSize: 17, color: '#ef4444', width: 20, textAlign: 'center' },
  profileCardItemTextLogout: { fontSize: 15, color: '#ef4444', fontWeight: '500' },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.lg, paddingBottom: 100 },

  // Error Banner
  errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', borderLeftWidth: 4, borderLeftColor: '#ef4444', paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16, borderRadius: 8, gap: 10 },
  errorBannerIcon: { fontSize: 16 },
  errorBannerText: { flex: 1, fontSize: 14, color: '#dc2626', fontWeight: '500' },
  errorBannerRetry: { fontSize: 14, color: '#0f766e', fontWeight: '600' },

  // Quick Actions
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1e293b', marginBottom: SPACING.md },
  quickActionsRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.lg },
  quickActionCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 16, padding: SPACING.md, alignItems: 'center', ...SHADOW.card },
  quickActionIconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm },
  quickActionIcon: { fontSize: 24 },
  quickActionLabel: { fontSize: 12, fontWeight: '500', color: '#1e293b', textAlign: 'center' },

  // Main Grid
  mainGrid: { flexDirection: 'row', gap: SPACING.lg },
  leftColumn: { flex: 2 },
  rightColumn: { flex: 1 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  viewAllLink: { fontSize: 14, color: '#0f766e', fontWeight: '600' },

  // Prescription Cards
  prescriptionCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 12, ...SHADOW.card },
  rxHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  rxAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ccfbf1', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rxAvatarText: { fontSize: 18, fontWeight: '700', color: '#0f766e' },
  rxInfo: { flex: 1 },
  rxPatientName: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  rxDate: { fontSize: 12, color: '#64748b', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  rxMeds: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  medTag: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  medTagText: { fontSize: 12, color: '#475569' },
  moreMeds: { fontSize: 12, color: '#94a3b8', paddingVertical: 5 },

  // Patient Insight Cards
  patientInsightCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 14, marginBottom: 12, ...SHADOW.card },
  piHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  piAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0f9ff', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  piAvatarText: { fontSize: 20 },
  piInfo: { flex: 1 },
  piName: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  piMeta: { fontSize: 11, color: '#64748b', marginTop: 1 },
  piAdherenceBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  piAdherenceText: { fontSize: 12, fontWeight: '700' },
  piConditions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  piConditionTag: { backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  piConditionText: { fontSize: 10, color: '#92400e', fontWeight: '500' },
  piStats: { flexDirection: 'row', gap: 8 },
  piStatText: { fontSize: 11, color: '#64748b' },
  viewMoreBtn: { alignItems: 'center', paddingVertical: 12 },
  viewMoreText: { fontSize: 13, color: '#0f766e', fontWeight: '600' },

  // Empty States
  emptyCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 30, alignItems: 'center', ...SHADOW.card },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#64748b', marginBottom: 16 },
  emptyBtn: { backgroundColor: '#0f766e', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  emptyBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  // FAB
  fab: { position: 'absolute', right: SPACING.lg, bottom: 80, width: 56, height: 56, borderRadius: 28, backgroundColor: '#0f766e', justifyContent: 'center', alignItems: 'center', ...SHADOW.card, zIndex: 100 },
  fabText: { color: COLORS.white, fontSize: 32, fontWeight: '300', lineHeight: 36 },
});

export default DoctorDashboard;

