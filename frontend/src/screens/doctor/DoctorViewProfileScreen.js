import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import ECGLogo from '../../components/ECGLogo';
import COLORS from '../../utils/colors';
import { SPACING, RADIUS, SHADOW, TYPOGRAPHY } from '../../utils/theme';

const DoctorViewProfileScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const doctorId = user?.profileId;
  const passedProfile = route?.params?.profile;

  const [profile, setProfile] = useState(passedProfile || null);
  const [loading, setLoading] = useState(!passedProfile);
  const [refreshing, setRefreshing] = useState(false);

  const loadProfile = useCallback(async (isRefresh = false) => {
    if (!doctorId) return;
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const data = await api.get(`/doctor/${doctorId}`);
      setProfile(data);
    } catch (err) {
      console.error('Failed to load doctor profile', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [doctorId]);

  useFocusEffect(
    useCallback(() => {
      if (passedProfile) {
        setProfile(passedProfile);
        setLoading(false);
      } else {
        loadProfile(false);
      }
    }, [passedProfile, loadProfile])
  );

  const displayName = profile?.name || user?.name || 'Doctor';
  const displayEmail = profile?.email || user?.email || '';
  const hasImage = profile?.profileImageUrl?.trim();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <ECGLogo size={28} />
          <Text style={styles.headerTitle}>MedLink</Text>
        </View>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadProfile(true)}
            colors={['#0f766e']}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        ) : profile ? (
          <View style={styles.card}>
            {/* Avatar & Name */}
            <View style={styles.profileHeader}>
              {hasImage ? (
                <Image source={{ uri: profile.profileImageUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <Text style={styles.profileName}>{displayName}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>Doctor</Text>
              </View>
            </View>

            {/* Info Sections */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              <InfoRow label="Email" value={displayEmail} />
              <InfoRow label="Phone" value={profile.phoneNumber || 'Not provided'} />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Professional Details</Text>
              <InfoRow label="Specialization" value={profile.specialization || 'Not provided'} />
              <InfoRow label="Hospital / Clinic" value={profile.hospital || 'Not provided'} />
              <InfoRow label="Department" value={profile.department || 'Not provided'} />
              <InfoRow label="License Number" value={profile.licenseNumber || 'Not provided'} />
              <InfoRow label="Years of Experience" value={profile.yearsOfExperience != null ? String(profile.yearsOfExperience) : 'Not provided'} />
              <InfoRow label="Consultation Timings" value={profile.consultationTimings || 'Not provided'} />
            </View>

            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Unable to load profile</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadProfile}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const InfoRow = ({ label, value }) => (
  <View style={infoRowStyles.row}>
    <Text style={infoRowStyles.label}>{label}</Text>
    <Text style={infoRowStyles.value}>{value}</Text>
  </View>
);

const infoRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  label: {
    ...TYPOGRAPHY.bodySmall,
    color: '#64748b',
    flex: 1,
  },
  value: {
    ...TYPOGRAPHY.bodySmall,
    color: '#1e293b',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f4',
  },
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
  editBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  editBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 32,
  },
  loadingContainer: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOW.card,
  },
  loadingText: {
    marginTop: SPACING.md,
    ...TYPOGRAPHY.body,
    color: '#64748b',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOW.card,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: SPACING.md,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0f766e',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  profileName: {
    ...TYPOGRAPHY.h2,
    color: '#1e293b',
    marginBottom: 6,
  },
  roleBadge: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803d',
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.label,
    color: '#0f766e',
    marginBottom: SPACING.md,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  editButton: {
    marginTop: SPACING.lg,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#0f766e',
    alignItems: 'center',
    ...SHADOW.card,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: '#64748b',
    marginBottom: SPACING.md,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#0f766e',
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default DoctorViewProfileScreen;
