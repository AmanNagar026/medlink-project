import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import ECGLogo from '../../components/ECGLogo';
import COLORS from '../../utils/colors';
import { SPACING, RADIUS, SHADOW, TYPOGRAPHY } from '../../utils/theme';

const DoctorProfileScreen = ({ navigation }) => {
  const { user, updateUser } = useAuth();
  const doctorId = user?.profileId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    specialization: '',
    hospital: '',
    department: '',
    licenseNumber: '',
    yearsOfExperience: '',
    consultationTimings: '',
    profileImageUrl: '',
  });

  const setField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: null }));
    }
  };

  const loadProfile = async () => {
    if (!doctorId) {
      setLoading(false);
      return;
    }
    try {
      const data = await api.get(`/doctor/${doctorId}`);
      setForm({
        name: data.name || user?.name || '',
        email: data.email || user?.email || '',
        phoneNumber: data.phoneNumber || '',
        specialization: data.specialization || '',
        hospital: data.hospital || '',
        department: data.department || '',
        licenseNumber: data.licenseNumber || '',
        yearsOfExperience: data.yearsOfExperience != null ? String(data.yearsOfExperience) : '',
        consultationTimings: data.consultationTimings || '',
        profileImageUrl: data.profileImageUrl || '',
      });
    } catch (err) {
      console.error('Failed to load doctor profile', err);
      Alert.alert('Error', 'Unable to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [doctorId]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      e.email = 'Enter a valid email';
    }
    if (!form.specialization.trim()) e.specialization = 'Specialization is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!doctorId) return;
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim() || null,
        specialization: form.specialization.trim(),
        hospital: form.hospital.trim() || null,
        department: form.department.trim() || null,
        licenseNumber: form.licenseNumber.trim() || null,
        yearsOfExperience: form.yearsOfExperience ? parseInt(form.yearsOfExperience, 10) || 0 : 0,
        consultationTimings: form.consultationTimings.trim() || null,
        profileImageUrl: form.profileImageUrl.trim() || null,
        available: true,
        qualifications: null,
      };

      const updated = await api.put(`/doctor/${doctorId}`, payload);

      // Update auth context so header and dashboard reflect latest name/email immediately
      if (updateUser) {
        updateUser({ name: updated.name, email: updated.email });
      }

      // Redirect to View Profile with updated data for immediate display (no manual refresh)
      navigation.replace('Profile', { profile: updated });
    } catch (err) {
      console.error('Failed to update doctor profile', err);
      Alert.alert('Error', err.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderField = (label, key, props = {}) => (
    <View style={styles.fieldWrapper}>
      <Text style={styles.fieldLabel}>
        {label}
        {props.required && <Text style={styles.requiredMark}> *</Text>}
      </Text>
      <TextInput
        style={[styles.input, errors[key] && styles.inputError]}
        value={form[key]}
        onChangeText={val => setField(key, val)}
        {...props}
      />
      {errors[key] && <Text style={styles.errorText}>{errors[key]}</Text>}
    </View>
  );

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
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>
            {(user?.name || 'D').charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.pageTitle}>Edit Profile</Text>
        <Text style={styles.pageSubtitle}>
          Update your personal and professional details. Changes apply across the dashboard.
        </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        ) : (
          <View style={styles.card}>
            {renderField('Full Name', 'name', { required: true, placeholder: 'Dr. Full Name' })}
            {renderField('Email', 'email', {
              required: true,
              keyboardType: 'email-address',
              autoCapitalize: 'none',
              placeholder: 'doctor@example.com',
            })}
            {renderField('Contact Number', 'phoneNumber', {
              keyboardType: 'phone-pad',
              placeholder: '+91...',
            })}
            {renderField('Specialization', 'specialization', {
              required: true,
              placeholder: 'Cardiologist, General Physician...',
            })}
            {renderField('Hospital / Clinic', 'hospital', {
              placeholder: 'Hospital or clinic name',
            })}
            {renderField('Department', 'department', {
              placeholder: 'Department',
            })}
            {renderField('License Number', 'licenseNumber', {
              placeholder: 'Medical registration / license number',
            })}
            {renderField('Years of Experience', 'yearsOfExperience', {
              keyboardType: 'numeric',
              placeholder: 'e.g. 10',
            })}
            {renderField('Consultation Timings', 'consultationTimings', {
              placeholder: 'Mon–Fri 9:00 AM – 5:00 PM',
            })}
            {renderField('Profile Image URL', 'profileImageUrl', {
              placeholder: 'https://...',
              autoCapitalize: 'none',
            })}

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 32,
  },
  pageTitle: {
    ...TYPOGRAPHY.h2,
    color: '#1e293b',
    marginBottom: 4,
  },
  pageSubtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: '#64748b',
    marginBottom: SPACING.lg,
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
  fieldWrapper: {
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    ...TYPOGRAPHY.label,
    color: '#334155',
    marginBottom: 4,
  },
  requiredMark: {
    color: '#dc2626',
  },
  input: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  inputError: {
    borderColor: '#dc2626',
  },
  errorText: {
    marginTop: 4,
    fontSize: 11,
    color: '#dc2626',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: SPACING.lg,
  },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  cancelText: {
    ...TYPOGRAPHY.bodySmall,
    color: '#64748b',
    fontWeight: '600',
  },
  saveBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#0f766e',
    ...SHADOW.card,
  },
  saveText: {
    ...TYPOGRAPHY.bodySmall,
    color: '#fff',
    fontWeight: '700',
  },
});

export default DoctorProfileScreen;

