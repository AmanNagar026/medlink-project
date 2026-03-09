import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TextInput,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import ECGLogo from '../../components/ECGLogo';
import prescriptionService from '../../services/prescriptionService';
import COLORS from '../../utils/colors';
import { FREQUENCY_OPTIONS } from '../../utils/constants';
import { SPACING, TYPOGRAPHY, RADIUS, SHADOW } from '../../utils/theme';

const { width } = Dimensions.get('window');
const MAX_CONTAINER_WIDTH = 1100;

const CreatePrescription = ({ navigation, route }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    patientId: route?.params?.patientId || '',
    patientName: route?.params?.patientName || '',
    patientAge: '',
    patientGender: '',
    diagnosis: '',
    notes: '',
    expiryDate: '',
  });
  const [medications, setMedications] = useState([
    {
      medicationName: '',
      dosage: '',
      frequency: 'ONCE_DAILY',
      durationDays: '',
    },
  ]);

  const set = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    // Clear error when field is edited
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: null }));
    }
  };

  const setMed = (index, key, val) => {
    setMedications((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [key]: val } : m))
    );
  };

  const addMedication = () => {
    setMedications((prev) => [
      ...prev,
      {
        medicationName: '',
        dosage: '',
        frequency: 'ONCE_DAILY',
        durationDays: '',
      },
    ]);
  };

  const removeMedication = (index) => {
    if (medications.length === 1) {
      setMedications([{
        medicationName: '',
        dosage: '',
        frequency: 'ONCE_DAILY',
        durationDays: '',
      }]);
      return;
    }
    setMedications((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.patientId.trim()) {
      newErrors.patientId = 'Patient ID is required';
    }
    if (!form.patientName.trim()) {
      newErrors.patientName = 'Patient Name is required';
    }
    if (medications.some((m) => !m.medicationName.trim())) {
      newErrors.medications = 'All medications need a name';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const prescription = {
        doctorId: user.profileId,
        doctorName: user.name,
        ...form,
        medications,
      };
      await prescriptionService.create(prescription);
      
      // Navigate to Dashboard with success message
      navigation.navigate('DoctorDashboard', {
        screen: 'DoctorDashboard',
        params: { successMsg: `Prescription saved for ${form.patientName}!` }
      });
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to create prescription');
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
          <ECGLogo size={28} />
          <Text style={styles.headerTitle}>MedLink</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{doctorName.charAt(0).toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Centered Container */}
          <View style={styles.centeredContainer}>
            {/* Breadcrumb */}
            <View style={styles.breadcrumb}>
              <TouchableOpacity onPress={() => navigation.navigate('Dashboard')}>
                <Text style={styles.breadcrumbLink}>Dashboard</Text>
              </TouchableOpacity>
              <Text style={styles.breadcrumbSeparator}>›</Text>
              <Text style={styles.breadcrumbActive}>New Prescription</Text>
            </View>

            {/* Page Title */}
            <Text style={styles.pageTitle}>Create New Prescription</Text>

            {/* Section 1 – Patient Information */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Patient Information</Text>
              
              <View style={styles.twoColumnGrid}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Patient ID <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={[styles.textInput, errors.patientId && styles.inputError]}
                    value={form.patientId}
                    onChangeText={(v) => set('patientId', v)}
                    placeholder="Enter patient ID"
                    placeholderTextColor="#cbd5e1"
                  />
                  {errors.patientId && <Text style={styles.errorText}>{errors.patientId}</Text>}
                </View>

                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Patient Name <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={[styles.textInput, errors.patientName && styles.inputError]}
                    value={form.patientName}
                    onChangeText={(v) => set('patientName', v)}
                    placeholder="Enter patient name"
                    placeholderTextColor="#cbd5e1"
                  />
                  {errors.patientName && <Text style={styles.errorText}>{errors.patientName}</Text>}
                </View>

                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Age</Text>
                  <TextInput
                    style={styles.textInput}
                    value={form.patientAge}
                    onChangeText={(v) => set('patientAge', v)}
                    placeholder="Enter age"
                    placeholderTextColor="#cbd5e1"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Gender</Text>
                  <TextInput
                    style={styles.textInput}
                    value={form.patientGender}
                    onChangeText={(v) => set('patientGender', v)}
                    placeholder="e.g., Male"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>
            </View>

            {/* Section 2 – Diagnosis & Notes */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Diagnosis & Notes</Text>
              
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Diagnosis</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={form.diagnosis}
                  onChangeText={(v) => set('diagnosis', v)}
                  placeholder="Enter diagnosis details..."
                  placeholderTextColor="#cbd5e1"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.twoColumnGrid}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Doctor Notes</Text>
                  <TextInput
                    style={styles.textInput}
                    value={form.notes}
                    onChangeText={(v) => set('notes', v)}
                    placeholder="e.g., After meals"
                    placeholderTextColor="#cbd5e1"
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Prescription Expiry Date (Optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={form.expiryDate}
                    onChangeText={(v) => set('expiryDate', v)}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#cbd5e1"
                  />
                </View>
              </View>
            </View>

            {/* Section 3 – Medications */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Medications</Text>
              {errors.medications && <Text style={styles.errorText}>{errors.medications}</Text>}
              
              {medications.map((med, index) => (
                <View key={index} style={styles.medicationContainer}>
                  <View style={styles.medicationRow}>
                    <View style={styles.medField}>
                      <Text style={styles.fieldLabel}>Medicine Name</Text>
                      <TextInput
                        style={styles.textInput}
                        value={med.medicationName}
                        onChangeText={(v) => setMed(index, 'medicationName', v)}
                        placeholder="Select or type medicine"
                        placeholderTextColor="#cbd5e1"
                      />
                    </View>

                    <View style={[styles.medField, { flex: 0.6 }]}>
                      <Text style={styles.fieldLabel}>Dosage</Text>
                      <TextInput
                        style={styles.textInput}
                        value={med.dosage}
                        onChangeText={(v) => setMed(index, 'dosage', v)}
                        placeholder="e.g., 500mg"
                        placeholderTextColor="#cbd5e1"
                      />
                    </View>

                    <View style={[styles.medField, { flex: 0.5 }]}>
                      <Text style={styles.fieldLabel}>Duration (days)</Text>
                      <TextInput
                        style={styles.textInput}
                        value={med.durationDays ? String(med.durationDays) : ''}
                        onChangeText={(v) => setMed(index, 'durationDays', parseInt(v) || 0)}
                        placeholder="e.g., 7"
                        placeholderTextColor="#94a3b8"
                        keyboardType="numeric"
                      />
                    </View>

                    <TouchableOpacity 
                      style={styles.deleteBtn}
                      onPress={() => removeMedication(index)}
                    >
                      <Text style={styles.deleteIcon}>🗑</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Frequency Pills for each medication */}
                  <View style={styles.frequencySection}>
                    <Text style={styles.fieldLabel}>Frequency</Text>
                    <View style={styles.frequencyPills}>
                      {FREQUENCY_OPTIONS.map((f) => (
                        <TouchableOpacity
                          key={f.value}
                          style={[
                            styles.freqPill,
                            med.frequency === f.value && styles.freqPillActive,
                          ]}
                          onPress={() => setMed(index, 'frequency', f.value)}
                        >
                          <Text
                            style={[
                              styles.freqPillText,
                              med.frequency === f.value && styles.freqPillTextActive,
                            ]}
                          >
                            {f.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              ))}

              <TouchableOpacity style={styles.addMedBtn} onPress={addMedication}>
                <Text style={styles.addMedIcon}>+</Text>
                <Text style={styles.addMedText}>Add Another Medicine</Text>
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.cancelBtn}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <Text style={styles.saveBtnText}>
                  {loading ? 'Saving...' : 'Save Prescription'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f4',
  },
  keyboardView: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },

  // Centered Container
  centeredContainer: {
    maxWidth: MAX_CONTAINER_WIDTH,
    width: '100%',
    alignSelf: 'center',
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
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: SPACING.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },

  // Breadcrumb
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  breadcrumbLink: {
    color: '#0f766e',
    fontSize: 13,
    fontWeight: '500',
  },
  breadcrumbSeparator: {
    color: '#94a3b8',
    fontSize: 13,
    marginHorizontal: SPACING.xs,
  },
  breadcrumbActive: {
    color: '#64748b',
    fontSize: 13,
  },

  // Page Title
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },

  // Cards
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOW.card,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },

  // Form Grid
  twoColumnGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  formField: {
    flex: 1,
    minWidth: 200,
  },

  // Labels
  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  required: {
    color: '#ef4444',
  },

  // Inputs
  textInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    fontSize: 11,
    color: '#ef4444',
    marginTop: 4,
  },

  // Select Field
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectText: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  selectArrow: {
    fontSize: 10,
    color: '#94a3b8',
  },

  // Gender Input

  // Medications
  medicationContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  medicationRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'flex-end',
  },
  medField: {
    flex: 1,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  deleteIcon: {
    fontSize: 16,
  },

  // Frequency
  frequencySection: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  frequencyPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  freqPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  freqPillActive: {
    backgroundColor: '#0f766e',
    borderColor: '#0f766e',
  },
  freqPillText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  freqPillTextActive: {
    color: COLORS.white,
  },

  // Add Medicine Button
  addMedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: SPACING.sm,
  },
  addMedIcon: {
    fontSize: 16,
    color: '#0f766e',
    marginRight: 6,
  },
  addMedText: {
    fontSize: 13,
    color: '#0f766e',
    fontWeight: '500',
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: COLORS.white,
  },
  cancelBtnText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  saveBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#0f766e',
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '600',
  },
});

export default CreatePrescription;
