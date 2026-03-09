import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import Header from '../../components/Header';
import COLORS from '../../utils/colors';
import { SPACING, RADIUS, SHADOW } from '../../utils/theme';
import { useAuth } from '../../context/AuthContext';
import medicationService from '../../services/medicationService';
import vitalsService from '../../services/vitalsService';
import patientService from '../../services/patientService';

const displayValue = (value, fallback = 'Not added') => {
  if (value === null || value === undefined || value === '') return fallback;
  return value;
};

const PatientProfileScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, logout, updateUser } = useAuth();
  const { width } = useWindowDimensions();
  const isTablet = width >= 760;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [patientProfile, setPatientProfile] = useState(null);
  const [medicationCount, setMedicationCount] = useState(0);
  const [latestVitals, setLatestVitals] = useState(null);

  const entranceAnim = useRef(new Animated.Value(0)).current;

  const profileRows = useMemo(() => {
    return [
      { label: 'Phone', value: displayValue(patientProfile?.phoneNumber || user?.phone) },
      { label: 'Age', value: displayValue(patientProfile?.age) },
      { label: 'Gender', value: displayValue(patientProfile?.gender) },
      { label: 'Blood Group', value: displayValue(patientProfile?.bloodGroup) },
      { label: 'Height', value: patientProfile?.height ? `${patientProfile.height} cm` : 'Not added' },
      { label: 'Weight', value: patientProfile?.weight ? `${patientProfile.weight} kg` : 'Not added' },
      { label: 'Address', value: displayValue(patientProfile?.address) },
    ];
  }, [patientProfile, user?.phone]);

  const animateIn = useCallback(() => {
    entranceAnim.setValue(0);
    Animated.timing(entranceAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entranceAnim]);

  const loadProfileData = useCallback(async () => {
    try {
      setLoading(true);
      const userId = user?.id || user?.userId;

      let profile = null;
      if (userId) {
        profile = await patientService.getProfileByUserId(userId).catch(() => null);
      }

      const resolvedPatientId = profile?.id || user?.profileId;

      const [medications, vitals] = await Promise.all([
        resolvedPatientId ? medicationService.getSchedule(resolvedPatientId).catch(() => []) : Promise.resolve([]),
        resolvedPatientId ? vitalsService.getLatest(resolvedPatientId).catch(() => null) : Promise.resolve(null),
      ]);

      setPatientProfile(profile);
      setMedicationCount((medications || []).filter((m) => m.active).length);
      setLatestVitals(vitals);

      if (profile && updateUser) {
        const nextProfileId = profile.id || user?.profileId;
        const nextName = profile.name || user?.name;
        const nextEmail = profile.email || user?.email;
        const nextPhone = profile.phoneNumber || user?.phone;
        const nextBloodGroup = profile.bloodGroup || user?.bloodGroup;

        const changed =
          user?.profileId !== nextProfileId ||
          user?.name !== nextName ||
          user?.email !== nextEmail ||
          user?.phone !== nextPhone ||
          user?.bloodGroup !== nextBloodGroup;

        if (changed) {
          updateUser({
            profileId: nextProfileId,
            name: nextName,
            email: nextEmail,
            phone: nextPhone,
            bloodGroup: nextBloodGroup,
          });
        }
      }

      animateIn();
    } catch (error) {
      console.error('Error loading patient profile:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [
    user?.id,
    user?.userId,
    user?.profileId,
    user?.name,
    user?.email,
    user?.phone,
    user?.bloodGroup,
    updateUser,
    animateIn,
  ]);

  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [loadProfileData])
  );

  useEffect(() => {
    if (route?.params?.refreshAt) {
      loadProfileData();
    }
  }, [route?.params?.refreshAt, loadProfileData]);

  const initials = (patientProfile?.name || user?.name || 'P')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="My Profile"
        subtitle="Personal and health details"
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.editButton}>Edit</Text>
          </TouchableOpacity>
        }
      />

      <Animated.ScrollView
        style={{
          opacity: entranceAnim,
          transform: [
            {
              translateY: entranceAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0],
              }),
            },
          ],
        }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadProfileData(); }} />}
      >
        <View style={styles.heroCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.userName}>{patientProfile?.name || user?.name || 'Patient'}</Text>
          <Text style={styles.userEmail}>{patientProfile?.email || user?.email || 'No email'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>Patient</Text>
          </View>
        </View>

        <View style={[styles.metricsRow, !isTablet && styles.metricsColumn]}>
          <Pressable style={({ hovered }) => [styles.metricCard, hovered && styles.metricCardHover]} onPress={() => navigation.navigate('Schedule')}>
            <Ionicons name="medkit" size={18} color={COLORS.primary} />
            <Text style={styles.metricValue}>{medicationCount}</Text>
            <Text style={styles.metricLabel}>Active Medications</Text>
          </Pressable>
          <Pressable style={({ hovered }) => [styles.metricCard, hovered && styles.metricCardHover]} onPress={() => navigation.navigate('Vitals')}>
            <Ionicons name="pulse" size={18} color={COLORS.primary} />
            <Text style={styles.metricValue}>
              {latestVitals?.heartRate ? `${latestVitals.heartRate}` : '--'}
            </Text>
            <Text style={styles.metricLabel}>Latest Heart Rate</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Necessary Information</Text>
          {profileRows.map((row) => (
            <View key={row.label} style={[styles.infoRow, !isTablet && styles.infoRowStack]}>
              <Text style={styles.infoLabel}>{row.label}</Text>
              <Text style={[styles.infoValue, !isTablet && styles.infoValueMobile]}>{row.value}</Text>
            </View>
          ))}
        </View>

        {latestVitals && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Latest Vitals Snapshot</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Vitals')}>
                <Text style={styles.linkText}>Open vitals</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.vitalsChipsRow}>
              {latestVitals.systolicBP && latestVitals.diastolicBP && (
                <Text style={styles.chip}>BP {latestVitals.systolicBP}/{latestVitals.diastolicBP}</Text>
              )}
              {latestVitals.heartRate && <Text style={styles.chip}>HR {latestVitals.heartRate} bpm</Text>}
              {latestVitals.glucose && <Text style={styles.chip}>Glucose {latestVitals.glucose}</Text>}
              {latestVitals.temperature && <Text style={styles.chip}>Temp {latestVitals.temperature}</Text>}
            </View>
          </View>
        )}

        <Pressable style={({ hovered, pressed }) => [styles.logoutButton, hovered && styles.logoutButtonHover, pressed && styles.logoutButtonPress]} onPress={logout}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f6fb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  editButton: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  heroCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    padding: SPACING.lg,
    ...SHADOW.card,
  },
  avatarLarge: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.white,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  userEmail: {
    marginTop: 2,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  roleBadge: {
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#def7f2',
  },
  roleText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  metricsColumn: {
    flexDirection: 'column',
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOW.card,
  },
  metricCardHover: {
    transform: [{ translateY: -2 }],
  },
  metricValue: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  metricLabel: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOW.card,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  linkText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#edf2f8',
    gap: SPACING.sm,
  },
  infoRowStack: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  infoValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  infoValueMobile: {
    flex: 0,
    textAlign: 'left',
  },
  vitalsChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#e8f5f2',
    color: COLORS.primaryDark,
    fontSize: 12,
    fontWeight: '700',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  logoutButton: {
    marginTop: SPACING.xs,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#f1c4c4',
    backgroundColor: '#fff6f6',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  logoutButtonHover: {
    backgroundColor: '#ffecec',
  },
  logoutButtonPress: {
    transform: [{ scale: 0.99 }],
  },
  logoutText: {
    color: COLORS.danger,
    fontWeight: '700',
  },
});

export default PatientProfileScreen;
