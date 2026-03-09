import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, SafeAreaView, ActivityIndicator, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import COLORS from '../../utils/colors';
import { SPACING, RADIUS, SHADOW, TYPOGRAPHY } from '../../utils/theme';
import { useAuth } from '../../context/AuthContext';
import patientService from '../../services/patientService';

const EditPatientDetailsScreen = () => {
  const navigation = useNavigation();
  const { user, updateUser } = useAuth();
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formDataLoaded, setFormDataLoaded] = useState(false);
  
  // Form state - All fields initialized
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    bloodGroup: '',
    address: '',
  });
  
  // Blood group options
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];

  // Load patient data when component mounts
  useEffect(() => {
    console.log('[EditProfile] Component mounted, user:', user ? 'exists' : 'null');
    loadPatientData();
  }, [user]);

  const loadPatientData = async () => {
    try {
      setIsLoading(true);
      console.log('[EditProfile] Loading patient data...');
      
      if (!user?.id) {
        console.warn('[EditProfile] No user ID found');
        setIsLoading(false);
        return;
      }

      // Set basic user info immediately
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
      }));

      // Try to fetch extended patient profile
      try {
        const response = await patientService.getProfileByUserId(user.id);
        console.log('[EditProfile] Patient data loaded:', response);
        
        if (response) {
          setFormData({
            name: response.name || user.name || '',
            email: response.email || user.email || '',
            phone: response.phoneNumber || '',
            age: response.age || '',
            gender: response.gender || '',
            height: response.height || '',
            weight: response.weight || '',
            bloodGroup: response.bloodGroup || '',
            address: response.address || '',
          });
          console.log('[EditProfile] ✓ Form populated with data');
        }
      } catch (error) {
        console.warn('[EditProfile] Could not load patient profile (OK):', error.message);
        // Continue with basic user info
      }
      
      setFormDataLoaded(true);
    } catch (error) {
      console.error('[EditProfile] Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name || !formData.email) {
      Alert.alert('Missing Information', 'Please fill in Name and Email fields.');
      return;
    }

    if (!formData.phone || formData.phone.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number.');
      return;
    }

    setIsSaving(true);
    try {
      console.log('[EditProfile] Saving profile data...');
      
      const updateData = {
        userId: user?.id,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phone.trim(),
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        address: formData.address.trim(),
        age: formData.age ? parseInt(formData.age) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
      };

      console.log('[EditProfile] Sending update data:', updateData);

      let response;
      let resolvedProfileId = user?.profileId;

      if (!resolvedProfileId && user?.id) {
        const existingProfile = await patientService.getProfileByUserId(user.id).catch(() => null);
        resolvedProfileId = existingProfile?.id || null;
      }

      if (resolvedProfileId) {
        response = await patientService.updateProfile(resolvedProfileId, updateData);
        console.log('[EditProfile] Profile updated:', response);
      } else {
        response = await patientService.createProfile(updateData);
        console.log('[EditProfile] Profile created:', response);
      }

      // Update auth context
      if (updateUser) {
        updateUser({
          ...user,
          profileId: response?.id || resolvedProfileId || user?.profileId,
          name: updateData.name,
          email: updateData.email,
          phone: updateData.phoneNumber,
          bloodGroup: updateData.bloodGroup,
        });
      }

      Alert.alert(
        '✅ Success!',
        'Profile updated successfully!',
        [
          {
            text: 'OK',
            onPress: () =>
              navigation.navigate('Profile', {
                refreshAt: Date.now(),
              }),
          }
        ]
      );
    } catch (error) {
      console.error('[EditProfile] Save error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to update profile.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Render input field component
  const renderInputField = (label, field, placeholder, icon, keyboardType = 'default') => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <Ionicons name={icon} size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          value={formData[field]}
          onChangeText={(value) => handleInputChange(field, value)}
          placeholderTextColor={COLORS.textLight}
          keyboardType={keyboardType}
          editable={!isSaving}
        />
      </View>
    </View>
  );

  // Render select dropdown
  const renderSelectField = (label, field, options, icon) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollOptions}>
        <View style={styles.optionsContainer}>
          {options.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionChip,
                formData[field] === option && styles.optionChipActive
              ]}
              onPress={() => handleInputChange(field, option)}
              disabled={isSaving}
            >
              <Text style={[
                styles.optionText,
                formData[field] === option && styles.optionTextActive
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  console.log('[EditProfile] Rendering, loaded:', formDataLoaded, 'form:', formData);

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Edit Profile"
        subtitle="Update your personal information"
        onBack={() => navigation.goBack()}
      />

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingOverlayText}>Loading...</Text>
        </View>
      )}

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Personal Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-circle" size={28} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Personal Information</Text>
          </View>

          {renderInputField('Full Name *', 'name', 'Enter your full name', 'person')}
          {renderInputField('Email Address *', 'email', 'Enter your email', 'mail', 'email-address')}
          {renderInputField('Phone Number *', 'phone', 'Enter phone number', 'call', 'phone-pad')}
          
          <View style={styles.row}>
            {renderInputField('Age', 'age', 'Enter age', 'calendar-number', 'numeric')}
            <View style={styles.rowSpacer} />
            {renderSelectField('Gender', 'gender', genderOptions, 'male-female')}
          </View>

          {renderInputField('Address', 'address', 'Enter your full address', 'location')}
        </View>

        {/* Medical Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="heart" size={28} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Medical Information</Text>
          </View>

          {renderSelectField('Blood Group', 'bloodGroup', bloodGroups, 'blood')}
          
          <View style={styles.row}>
            {renderInputField('Height (cm)', 'height', 'e.g., 170', 'arrow-up', 'numeric')}
            <View style={styles.rowSpacer} />
            {renderInputField('Weight (kg)', 'weight', 'e.g., 70', 'scale', 'numeric')}
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Make sure all information is accurate for better healthcare.
          </Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, (isSaving || isLoading) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving || isLoading}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <View style={styles.saveButtonContent}>
              <ActivityIndicator size="small" color={COLORS.white} />
              <Text style={styles.saveButtonText}>Saving...</Text>
            </View>
          ) : (
            <View style={styles.saveButtonContent}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>All changes are saved securely</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 70,
    right: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white + 'F0',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
    zIndex: 1000,
    ...SHADOW.card,
  },
  loadingOverlayText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  
  // Card Styles
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOW.card,
    marginBottom: SPACING.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  
  // Input Styles
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    minHeight: 48,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    paddingVertical: SPACING.sm,
  },
  scrollOptions: {
    flexGrow: 1,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingRight: SPACING.md,
  },
  optionChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 80,
    alignItems: 'center',
  },
  optionChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  optionTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  
  // Row Layout
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  rowSpacer: {
    width: SPACING.md,
  },
  
  // Info Box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight + '20',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  
  // Save Button
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: SPACING.md,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  
  // Footer
  footer: {
    alignItems: 'center',
    padding: SPACING.lg,
    marginTop: SPACING.md,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});

export default EditPatientDetailsScreen;
