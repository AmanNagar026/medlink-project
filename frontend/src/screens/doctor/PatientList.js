import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  SafeAreaView,
  Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import ECGLogo from '../../components/ECGLogo';
import { api } from '../../services/api';
import prescriptionService from '../../services/prescriptionService';
import COLORS from '../../utils/colors';
import { SPACING, SHADOW } from '../../utils/theme';

const PatientList = ({ navigation, route }) => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const bannerAnim = useRef(new Animated.Value(0)).current;

  const loadData = async () => {
    try {
      const [patientData, rxData] = await Promise.all([
        api.get(`/patient/doctor/${user.profileId}`).catch(() => []),
        prescriptionService.getByDoctor(user.profileId).catch(() => []),
      ]);
      const pts = Array.isArray(patientData) ? patientData : [];
      const rxs = Array.isArray(rxData) ? rxData : [];
      setPatients(pts);
      setPrescriptions(rxs);
      setFiltered(pts);
    } catch (err) {
      console.error('Load patients error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const showBanner = (msg) => {
    setSuccessMsg(msg);
    bannerAnim.setValue(0);
    Animated.sequence([
      Animated.timing(bannerAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(bannerAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setSuccessMsg(''));
  };

  useFocusEffect(
    useCallback(() => {
      // Prepend newly added patient immediately from nav params
      const newPt = route?.params?.newPatient;
      const msg = route?.params?.successMsg;
      if (newPt) {
        setPatients((prev) => {
          const exists = prev.some((p) => (p.id || p._id) === (newPt.id || newPt._id));
          return exists ? prev : [newPt, ...prev];
        });
        setFiltered((prev) => {
          const exists = prev.some((p) => (p.id || p._id) === (newPt.id || newPt._id));
          return exists ? prev : [newPt, ...prev];
        });
        // Clear the param so it doesn't re-trigger on future focuses
        navigation.setParams({ newPatient: undefined, successMsg: undefined });
        if (msg) showBanner(msg);
      }
      // Always refresh from backend on focus
      loadData();
    }, [route?.params?.newPatient])
  );

  const getPatientRx = (patientId) =>
    prescriptions.filter((rx) => rx.patientId === patientId);

  const getMedNames = (patientId) => {
    const rxList = getPatientRx(patientId);
    const names = [];
    rxList.forEach((rx) =>
      rx.medications?.forEach((m) => {
        if (m.medicationName && !names.includes(m.medicationName)) {
          names.push(m.medicationName + (m.dosage ? ' ' + m.dosage : ''));
        }
      })
    );
    return names.slice(0, 2);
  };

  const getAdherence = (patientId) => {
    const rxList = getPatientRx(patientId);
    if (!rxList.length) return null;
    const active = rxList.filter((rx) => rx.status === 'ACTIVE').length;
    return Math.round((active / rxList.length) * 100);
  };

  const adherenceColor = (pct) => {
    if (pct === null) return '#94a3b8';
    if (pct >= 80) return '#16a34a';
    if (pct >= 50) return '#d97706';
    return '#dc2626';
  };

  const handleSearch = (text) => {
    setSearch(text);
    const q = text.toLowerCase();
    if (!q) {
      setFiltered(patients);
      return;
    }
    setFiltered(
      patients.filter((p) => {
        const medNames = getMedNames(p.id || p._id).join(' ').toLowerCase();
        return (
          p.name?.toLowerCase().includes(q) ||
          String(p.id || p._id || '').toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q) ||
          p.chronicConditions?.some((c) => c.toLowerCase().includes(q)) ||
          medNames.includes(q)
        );
      })
    );
  };

  const renderItem = ({ item }) => {
    const pid = item.id || item._id || '';
    const meds = getMedNames(pid);
    const adherence = getAdherence(pid);
    const initial = (item.name || '?').charAt(0).toUpperCase();

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          {/* Avatar */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>

          {/* Info */}
          <View style={styles.cardInfo}>
            <Text style={styles.patientName}>{item.name}</Text>
            <Text style={styles.patientId}>Patient ID: {pid}</Text>

            {meds.length > 0 && (
              <View style={styles.medRow}>
                <Text style={styles.medIcon}>💊</Text>
                <Text style={styles.medText} numberOfLines={1}>
                  {meds.join(' · ')}
                </Text>
              </View>
            )}
            {item.phone && (
              <View style={styles.medRow}>
                <Text style={styles.medIcon}>📞</Text>
                <Text style={styles.medText}>{item.phone}</Text>
              </View>
            )}
          </View>

          {/* Right side */}
          <View style={styles.cardRight}>
            <TouchableOpacity
              style={styles.viewBtn}
              onPress={() =>
                navigation.navigate('CreatePrescription', {
                  patientId: pid,
                  patientName: item.name,
                })
              }
            >
              <Text style={styles.viewBtnText}>View Profile</Text>
            </TouchableOpacity>

            {adherence !== null && (
              <View
                style={[
                  styles.adherenceBadge,
                  { backgroundColor: adherenceColor(adherence) + '22' },
                ]}
              >
                <Text
                  style={[
                    styles.adherenceText,
                    { color: adherenceColor(adherence) },
                  ]}
                >
                  {adherence}%
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <ECGLogo size={28} />
          <Text style={styles.headerTitle}>MedLink</Text>
        </View>
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>
            {(user?.name || 'D').charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Success Banner */}
      {successMsg !== '' && (
        <Animated.View
          style={[
            styles.successBanner,
            {
              opacity: bannerAnim,
              transform: [{
                translateY: bannerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              }],
            },
          ]}
        >
          <Text style={styles.successBannerIcon}>✓</Text>
          <Text style={styles.successBannerText}>{successMsg}</Text>
        </Animated.View>
      )}

      {/* Page Title */}
      <View style={styles.pageTitleRow}>
        <Text style={styles.pageTitle}>Patients</Text>
        <Text style={styles.patientCount}>{filtered.length} total</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={handleSearch}
            placeholder="Search by name, ID, or condition..."
            placeholderTextColor="#94a3b8"
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddPatient')}
        >
          <Text style={styles.addBtnText}>+ Add Patient</Text>
        </TouchableOpacity>
      </View>

      {/* Patient List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id || item._id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            colors={['#0f766e']}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No patients found</Text>
            <Text style={styles.emptySubtitle}>
              {search
                ? 'Try a different search term'
                : 'No patients assigned yet'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f4',
  },

  // Success Banner
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    borderLeftWidth: 4,
    borderLeftColor: '#16a34a',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  successBannerIcon: {
    fontSize: 16,
    color: '#16a34a',
    fontWeight: '700',
  },
  successBannerText: {
    fontSize: 14,
    color: '#15803d',
    fontWeight: '500',
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: '#0f766e',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '300',
    lineHeight: 24,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  headerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  // Page Title
  pageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: 20,
    paddingBottom: 8,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1e293b',
  },
  patientCount: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...SHADOW.card,
    gap: 8,
  },
  searchIcon: {
    fontSize: 15,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
    padding: 0,
  },
  clearIcon: {
    fontSize: 13,
    color: '#94a3b8',
    paddingHorizontal: 4,
  },
  addBtn: {
    backgroundColor: '#0f766e',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    ...SHADOW.card,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  // List
  list: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 24,
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 12,
    padding: 16,
    ...SHADOW.card,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ccfbf1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f766e',
  },
  cardInfo: {
    flex: 1,
    paddingRight: 8,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  patientId: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 6,
  },
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  medIcon: {
    fontSize: 12,
  },
  medText: {
    fontSize: 12,
    color: '#475569',
    flex: 1,
  },

  // Right side
  cardRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  viewBtn: {
    backgroundColor: '#0f766e',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  viewBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  adherenceBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    minWidth: 48,
    alignItems: 'center',
  },
  adherenceText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 52,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
});

export default PatientList;
