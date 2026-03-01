import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import ECGLogo from '../../components/ECGLogo';
import { api } from '../../services/api';
import { usePatientSync } from '../../hooks/usePatientSync';
import { SPACING, SHADOW } from '../../utils/theme';

const GENDERS = ['Male', 'Female', 'Other'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const AddPatientScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Use the patient sync hook for real-time updates
  const { addPatient } = usePatientSync(user?.profileId);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    age: '',
    gender: '',
    bloodGroup: '',
    address: '',
    chronicConditions: '',
    allergies: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  const set = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.phoneNumber.trim()) e.phoneNumber = 'Contact number is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim() || null,
        phoneNumber: form.phoneNumber.trim(),
        dateOfBirth: form.dateOfBirth.trim() || null,
        gender: form.gender || null,
        bloodGroup: form.bloodGroup || null,
        address: form.address.trim() || null,
        chronicConditions: form.chronicConditions
          ? form.chronicConditions.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        allergies: form.allergies
          ? form.allergies.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        emergencyContactName: form.emergencyContactName.trim() || null,
        emergencyContactPhone: form.emergencyContactPhone.trim() || null,
        assignedDoctorId: user?.profileId || null,
      };

      // Use the hook's addPatient function for proper real-time sync
      const createdPatient = await addPatient(payload);

      // Navigate to Doctor Dashboard with success message (top-level params for React Navigation)
      navigation.navigate('DoctorDashboard', {
        successMsg: `${form.name.trim()} has been added successfully!`,
        newPatient: createdPatient,
      });
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to add patient. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const doctorName = user?.name?.split(' ')[0] || 'Doctor';

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
          <Text style={styles.headerAvatarText}>{doctorName.charAt(0).toUpperCase()}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Breadcrumb */}
          <View style={styles.breadcrumb}>
            <TouchableOpacity onPress={() => navigation.navigate('PatientList')}>
              <Text style={styles.breadcrumbLink}>Patients</Text>
            </TouchableOpacity>
            <Text style={styles.breadcrumbSep}>›</Text>
            <Text style={styles.breadcrumbActive}>Add New Patient</Text>
          </View>

          <Text style={styles.pageTitle}>Add New Patient</Text>

          {/* Two-column card layout */}
          <View style={styles.twoColLayout}>

            {/* LEFT – Basic Info */}
            <View style={[styles.card, styles.cardFlex]}>
              <Text style={styles.cardTitle}>Basic Info</Text>

              <Field label="Full Name" required error={errors.name}>
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  value={form.name}
                  onChangeText={(v) => set('name', v)}
                  placeholder="Enter full name..."
                  placeholderTextColor="#94a3b8"
                />
              </Field>

              <Field label="Date of Birth">
                <TextInput
                  style={styles.input}
                  value={form.dateOfBirth}
                  onChangeText={(v) => set('dateOfBirth', v)}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94a3b8"
                />
              </Field>

              <Field label="Age">
                <TextInput
                  style={styles.input}
                  value={form.age}
                  onChangeText={(v) => set('age', v)}
                  placeholder="e.g. 45"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                />
              </Field>

              <Field label="Gender">
                <View style={styles.radioGroup}>
                  {GENDERS.map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.radioOption,
                        form.gender === g && styles.radioOptionActive,
                      ]}
                      onPress={() => set('gender', g)}
                    >
                      <View style={[styles.radioCircle, form.gender === g && styles.radioCircleActive]}>
                        {form.gender === g && <View style={styles.radioDot} />}
                      </View>
                      <Text style={[styles.radioLabel, form.gender === g && styles.radioLabelActive]}>
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Field>

              <Field label="Blood Group">
                <View style={styles.chipGroup}>
                  {BLOOD_GROUPS.map((bg) => (
                    <TouchableOpacity
                      key={bg}
                      style={[styles.chip, form.bloodGroup === bg && styles.chipActive]}
                      onPress={() => set('bloodGroup', bg)}
                    >
                      <Text style={[styles.chipText, form.bloodGroup === bg && styles.chipTextActive]}>
                        {bg}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Field>

              <Field label="Contact Number" required error={errors.phoneNumber}>
                <View style={[styles.inputRow, errors.phoneNumber && styles.inputError]}>
                  <Text style={styles.inputPrefix}>📞</Text>
                  <TextInput
                    style={styles.inputInner}
                    value={form.phoneNumber}
                    onChangeText={(v) => set('phoneNumber', v)}
                    placeholder="+91 e.g. 1234567890"
                    placeholderTextColor="#94a3b8"
                    keyboardType="phone-pad"
                  />
                </View>
              </Field>

              <Field label="Email">
                <TextInput
                  style={styles.input}
                  value={form.email}
                  onChangeText={(v) => set('email', v)}
                  placeholder="e.g. patient@email.com"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </Field>
            </View>

            {/* RIGHT – Medical Info */}
            <View style={[styles.card, styles.cardFlex]}>
              <Text style={styles.cardTitle}>Medical Info</Text>

              <Field label="Medical Conditions">
                <TextInput
                  style={styles.input}
                  value={form.chronicConditions}
                  onChangeText={(v) => set('chronicConditions', v)}
                  placeholder="e.g. Diabetes, Hypertension..."
                  placeholderTextColor="#94a3b8"
                />
                <Text style={styles.hint}>Separate multiple with commas</Text>
              </Field>

              <Field label="Allergies">
                <TextInput
                  style={styles.input}
                  value={form.allergies}
                  onChangeText={(v) => set('allergies', v)}
                  placeholder="e.g. Penicillin, Nuts..."
                  placeholderTextColor="#94a3b8"
                />
                <Text style={styles.hint}>Separate multiple with commas</Text>
              </Field>

              <Field label="Emergency Contact">
                <TextInput
                  style={[styles.input, { marginBottom: 8 }]}
                  value={form.emergencyContactName}
                  onChangeText={(v) => set('emergencyContactName', v)}
                  placeholder="Enter emergency contact person..."
                  placeholderTextColor="#94a3b8"
                />
                <TextInput
                  style={styles.input}
                  value={form.emergencyContactPhone}
                  onChangeText={(v) => set('emergencyContactPhone', v)}
                  placeholder="Emergency phone number..."
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                />
              </Field>

              <Field label="Address">
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={form.address}
                  onChangeText={(v) => set('address', v)}
                  placeholder="Enter full address..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={3}
                />
              </Field>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, loading && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.submitBtnInner}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={[styles.submitBtnText, { marginLeft: 8 }]}>Saving...</Text>
                </View>
              ) : (
                <Text style={styles.submitBtnText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

/* ── Helper wrapper component ── */
const Field = ({ label, required, error, children }) => (
  <View style={fieldStyles.wrapper}>
    <Text style={fieldStyles.label}>
      {label}
      {required && <Text style={fieldStyles.required}> *</Text>}
    </Text>
    {children}
    {error && <Text style={fieldStyles.error}>{error}</Text>}
  </View>
);

const fieldStyles = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  required: { color: '#ef4444' },
  error: { fontSize: 11, color: '#ef4444', marginTop: 4 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f4' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: '#0f766e',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  backIcon: { color: '#fff', fontSize: 22, fontWeight: '300', lineHeight: 24 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  headerAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerAvatarText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.lg, paddingBottom: 40 },

  // Breadcrumb
  breadcrumb: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  breadcrumbLink: { color: '#0f766e', fontSize: 13, fontWeight: '500' },
  breadcrumbSep: { color: '#94a3b8', fontSize: 13, marginHorizontal: 6 },
  breadcrumbActive: { color: '#64748b', fontSize: 13 },

  pageTitle: {
    fontSize: 26, fontWeight: '700', color: '#1e293b', marginBottom: 20,
  },

  // Layout
  twoColLayout: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    ...SHADOW.card,
  },
  cardFlex: { flex: 1, minWidth: 280 },
  cardTitle: {
    fontSize: 16, fontWeight: '700', color: '#0f766e',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },

  // Inputs
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#1e293b',
  },
  inputError: { borderColor: '#ef4444' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  inputPrefix: { fontSize: 16 },
  inputInner: { flex: 1, fontSize: 14, color: '#1e293b', padding: 0 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  hint: { fontSize: 11, color: '#94a3b8', marginTop: 4 },

  // Gender radio
  radioGroup: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  radioOptionActive: {
    borderColor: '#0f766e',
    backgroundColor: '#f0fdf9',
  },
  radioCircle: {
    width: 16, height: 16, borderRadius: 8,
    borderWidth: 2, borderColor: '#cbd5e1',
    justifyContent: 'center', alignItems: 'center',
  },
  radioCircleActive: { borderColor: '#0f766e' },
  radioDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#0f766e',
  },
  radioLabel: { fontSize: 13, color: '#475569', fontWeight: '500' },
  radioLabelActive: { color: '#0f766e', fontWeight: '600' },

  // Blood group chips
  chipGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
    borderColor: '#e2e8f0', backgroundColor: '#f8fafc',
  },
  chipActive: { borderColor: '#0f766e', backgroundColor: '#0f766e' },
  chipText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '600' },

  // Action buttons
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 4,
  },
  cancelBtn: {
    paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  cancelBtnText: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  submitBtn: {
    paddingHorizontal: 32, paddingVertical: 12,
    borderRadius: 10, backgroundColor: '#0f766e',
    ...SHADOW.card,
  },
  submitBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: { fontSize: 14, color: '#fff', fontWeight: '700' },
});

export default AddPatientScreen;
