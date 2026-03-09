import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
  Modal,
  Pressable,
  TextInput,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import COLORS from '../../utils/colors';
import { SPACING, RADIUS, SHADOW } from '../../utils/theme';
import medicationService from '../../services/medicationService';
import { useAuth } from '../../context/AuthContext';

const FREQUENCY_OPTIONS = [
  { label: 'Once', value: 'ONCE_DAILY', count: 1 },
  { label: 'Twice', value: 'TWICE_DAILY', count: 2 },
  { label: '3 Times', value: 'THREE_TIMES_DAILY', count: 3 },
  { label: '4 Times', value: 'FOUR_TIMES_DAILY', count: 4 },
  { label: 'As Needed', value: 'AS_NEEDED', count: 1 },
];

const to24h = (hour, minute, ampm) => {
  let h = hour;
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return `${h.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

const formatTimeDisplay = (timeString) => {
  const [hours = '00', minutes = '00'] = timeString.split(':');
  const hour = parseInt(hours, 10);
  if (Number.isNaN(hour)) return timeString;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

const formatDateDisplay = (date) => {
  if (!date) return 'Not set';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const toLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const AddMedicationScreen = ({ navigation }) => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [medicationName, setMedicationName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('ONCE_DAILY');
  const [instructions, setInstructions] = useState('');
  const [scheduledTimes, setScheduledTimes] = useState([]);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(null);
  const [reminderEnabled, setReminderEnabled] = useState(true);

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [currentTimeIndex, setCurrentTimeIndex] = useState(-1);
  const [selectedHour, setSelectedHour] = useState(9);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedAmPm, setSelectedAmPm] = useState('AM');

  const formAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(formAnim, {
      toValue: 1,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [formAnim]);

  const requiredTimeCount = useMemo(() => {
    const option = FREQUENCY_OPTIONS.find((item) => item.value === frequency);
    return option?.count || 1;
  }, [frequency]);

  const showTimePickerHandler = (index = -1) => {
    setCurrentTimeIndex(index);

    if (index >= 0 && index < scheduledTimes.length) {
      const time = scheduledTimes[index];
      const [hours = '09', minutes = '00'] = time.split(':');
      const hourNum = parseInt(hours, 10);
      const ampm = hourNum >= 12 ? 'PM' : 'AM';
      const displayHour = hourNum % 12 || 12;
      setSelectedHour(displayHour);
      setSelectedMinute(parseInt(minutes, 10));
      setSelectedAmPm(ampm);
    } else {
      const now = new Date();
      setSelectedHour(now.getHours() % 12 || 12);
      setSelectedMinute(now.getMinutes());
      setSelectedAmPm(now.getHours() >= 12 ? 'PM' : 'AM');
    }

    setShowTimePicker(true);
  };

  const confirmTimeSelection = () => {
    const timeString = to24h(selectedHour, selectedMinute, selectedAmPm);
    if (currentTimeIndex >= 0 && currentTimeIndex < scheduledTimes.length) {
      const updated = [...scheduledTimes];
      updated[currentTimeIndex] = timeString;
      setScheduledTimes(Array.from(new Set(updated)).sort());
    } else {
      const next = [...scheduledTimes, timeString];
      setScheduledTimes(Array.from(new Set(next)).sort());
    }
    setShowTimePicker(false);
    setCurrentTimeIndex(-1);
  };

  const removeTime = (index) => {
    setScheduledTimes((prev) => prev.filter((_, i) => i !== index));
  };

  const onStartDateChange = (date) => {
    setStartDate(date);
    if (endDate && endDate < date) {
      setEndDate(null);
    }
  };

  const onEndDateChange = (date) => {
    if (date < startDate) {
      Alert.alert('Invalid end date', 'End date must be on or after start date.');
      return;
    }
    setEndDate(date);
  };

  const handleSubmit = async () => {
    if (!medicationName.trim()) {
      Alert.alert('Missing Information', 'Please enter a medication name.');
      return;
    }

    if (!dosage.trim()) {
      Alert.alert('Missing Information', 'Please enter a dosage.');
      return;
    }

    if (scheduledTimes.length === 0) {
      Alert.alert('Missing Information', 'Please add at least one scheduled time.');
      return;
    }

    if (scheduledTimes.length < requiredTimeCount) {
      Alert.alert(
        'Not enough times',
        `For ${frequency.replace(/_/g, ' ').toLowerCase()}, add at least ${requiredTimeCount} time(s).`
      );
      return;
    }

    const patientId = user?.profileId || user?.id || user?.userId;
    if (!patientId) {
      Alert.alert('Profile Error', 'Could not find patient profile id. Please re-login and try again.');
      return;
    }

    setLoading(true);
    try {
      const normalizedTimes = [...scheduledTimes].sort().slice(0, requiredTimeCount);

      const scheduleData = {
        medicationName: medicationName.trim(),
        dosage: dosage.trim(),
        frequency,
        instructions: instructions.trim(),
        scheduledTimes: normalizedTimes,
        startDate: toLocalDateString(startDate),
        endDate: endDate ? toLocalDateString(endDate) : null,
        patientId,
        patientName: user?.name || 'Patient',
        active: true,
        reminderEnabled,
      };

      await medicationService.scheduleMedication(scheduleData);

      Alert.alert('Medication Added', `${medicationName} was saved successfully.`, [
        {
          text: 'Go to Dashboard',
          onPress: () => {
            navigation.navigate('Dashboard', {
              screen: 'PatientDashboard',
              params: { refreshAt: Date.now(), justAddedMedication: true },
            });
          },
        },
      ]);
    } catch (error) {
      console.error('Error adding medication:', error);
      Alert.alert('Error', error?.message || 'Failed to add medication. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Add Medication"
        subtitle="Create a medication schedule"
        onBack={() => navigation.goBack()}
      />

      <Animated.View
        style={{
          flex: 1,
          opacity: formAnim,
          transform: [
            {
              translateY: formAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0],
              }),
            },
          ],
        }}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentInner}>
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Medication Details</Text>

            <Text style={styles.label}>Medication Name *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="pill-outline" size={18} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Metformin"
                value={medicationName}
                onChangeText={setMedicationName}
                placeholderTextColor={COLORS.textLight}
              />
            </View>

            <Text style={styles.label}>Dosage *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="flask-outline" size={18} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="e.g., 500 mg"
                value={dosage}
                onChangeText={setDosage}
                placeholderTextColor={COLORS.textLight}
              />
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Schedule</Text>
            <Text style={styles.label}>Frequency</Text>
            <View style={styles.frequencyRow}>
              {FREQUENCY_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => setFrequency(option.value)}
                  style={({ hovered, pressed }) => [
                    styles.frequencyPill,
                    frequency === option.value && styles.frequencyPillActive,
                    hovered && styles.frequencyPillHover,
                    pressed && styles.frequencyPillPressed,
                  ]}
                >
                  <Text style={[styles.frequencyPillText, frequency === option.value && styles.frequencyPillTextActive]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.hint}>Add at least {requiredTimeCount} time(s) for this frequency.</Text>

            <Text style={[styles.label, { marginTop: SPACING.md }]}>Scheduled Times *</Text>
            <View style={styles.timeList}>
              {scheduledTimes.map((time, index) => (
                <Pressable
                  key={`${time}-${index}`}
                  style={({ hovered }) => [styles.timeChip, hovered && styles.timeChipHover]}
                  onPress={() => showTimePickerHandler(index)}
                >
                  <Text style={styles.timeChipText}>{formatTimeDisplay(time)}</Text>
                  <TouchableOpacity onPress={() => removeTime(index)}>
                    <Ionicons name="close-circle" size={18} color={COLORS.danger} />
                  </TouchableOpacity>
                </Pressable>
              ))}

              <Pressable
                onPress={() => showTimePickerHandler()}
                style={({ hovered, pressed }) => [
                  styles.addTimeChip,
                  hovered && styles.addTimeChipHover,
                  pressed && styles.addTimeChipPressed,
                ]}
              >
                <Ionicons name="add" size={16} color={COLORS.primary} />
                <Text style={styles.addTimeChipText}>Add Time</Text>
              </Pressable>
            </View>

            <View style={styles.dateGrid}>
              <View style={styles.dateCell}>
                <Text style={styles.label}>Start Date</Text>
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartDatePicker(true)}>
                  <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.dateButtonText}>{formatDateDisplay(startDate)}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.dateCell}>
                <Text style={styles.label}>End Date</Text>
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndDatePicker(true)}>
                  <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.dateButtonText}>{formatDateDisplay(endDate)}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <Text style={styles.label}>Instructions</Text>
            <View style={styles.textAreaWrapper}>
              <TextInput
                style={styles.textAreaInput}
                placeholder="e.g., Take after meals"
                value={instructions}
                onChangeText={setInstructions}
                placeholderTextColor={COLORS.textLight}
                multiline
              />
            </View>

            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchTitle}>Enable reminders</Text>
                <Text style={styles.switchHint}>Notify at selected times.</Text>
              </View>
              <TouchableOpacity
                style={[styles.toggleSwitch, reminderEnabled && styles.toggleSwitchActive]}
                onPress={() => setReminderEnabled((prev) => !prev)}
              >
                <View style={[styles.toggleKnob, reminderEnabled && styles.toggleKnobActive]} />
              </TouchableOpacity>
            </View>
          </View>

          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            style={({ hovered, pressed }) => [
              styles.submitButton,
              hovered && styles.submitButtonHover,
              pressed && styles.submitButtonPressed,
              loading && styles.submitButtonDisabled,
            ]}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.white} />
            <Text style={styles.submitButtonText}>{loading ? 'Saving...' : 'Save Medication'}</Text>
          </Pressable>

          <View style={{ height: 32 }} />
        </ScrollView>
      </Animated.View>

      <Modal transparent visible={showTimePicker} animationType="slide" onRequestClose={() => setShowTimePicker(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowTimePicker(false)}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Time</Text>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                <Ionicons name="close" size={26} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.timePickerContent}>
              <View style={styles.timeColumn}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                    <TouchableOpacity
                      key={hour}
                      style={[styles.timeOption, selectedHour === hour && styles.timeOptionActive]}
                      onPress={() => setSelectedHour(hour)}
                    >
                      <Text style={[styles.timeOptionText, selectedHour === hour && styles.timeOptionTextActive]}>
                        {hour.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <Text style={styles.timeSeparator}>:</Text>

              <View style={styles.timeColumn}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
                    <TouchableOpacity
                      key={minute}
                      style={[styles.timeOption, selectedMinute === minute && styles.timeOptionActive]}
                      onPress={() => setSelectedMinute(minute)}
                    >
                      <Text style={[styles.timeOptionText, selectedMinute === minute && styles.timeOptionTextActive]}>
                        {minute.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.ampmColumn}>
                {['AM', 'PM'].map((v) => (
                  <TouchableOpacity
                    key={v}
                    style={[styles.ampmButton, selectedAmPm === v && styles.ampmButtonActive]}
                    onPress={() => setSelectedAmPm(v)}
                  >
                    <Text style={[styles.ampmText, selectedAmPm === v && styles.ampmTextActive]}>{v}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalFooterRow}>
              <TouchableOpacity style={styles.footerGhostButton} onPress={() => setShowTimePicker(false)}>
                <Text style={styles.footerGhostButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.footerPrimaryButton} onPress={confirmTimeSelection}>
                <Text style={styles.footerPrimaryButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      <Modal transparent visible={showStartDatePicker} animationType="slide" onRequestClose={() => setShowStartDatePicker(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowStartDatePicker(false)}>
          <View style={styles.dateModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Start Date</Text>
              <TouchableOpacity onPress={() => setShowStartDatePicker(false)}>
                <Ionicons name="close" size={26} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.dateList} showsVerticalScrollIndicator={false}>
              {Array.from({ length: 365 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() + i);
                const active = startDate.toDateString() === date.toDateString();
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.dateOption, active && styles.dateOptionActive]}
                    onPress={() => onStartDateChange(date)}
                  >
                    <Text style={[styles.dateOptionText, active && styles.dateOptionTextActive]}>
                      {date.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity style={styles.footerPrimaryButtonSingle} onPress={() => setShowStartDatePicker(false)}>
              <Text style={styles.footerPrimaryButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <Modal transparent visible={showEndDatePicker} animationType="slide" onRequestClose={() => setShowEndDatePicker(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowEndDatePicker(false)}>
          <View style={styles.dateModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select End Date</Text>
              <TouchableOpacity onPress={() => setShowEndDatePicker(false)}>
                <Ionicons name="close" size={26} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.dateList} showsVerticalScrollIndicator={false}>
              {Array.from({ length: 365 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() + i);
                const active = endDate && endDate.toDateString() === date.toDateString();
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.dateOption, active && styles.dateOptionActive]}
                    onPress={() => onEndDateChange(date)}
                  >
                    <Text style={[styles.dateOptionText, active && styles.dateOptionTextActive]}>
                      {date.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.modalFooterRow}>
              <TouchableOpacity
                style={styles.footerGhostButton}
                onPress={() => {
                  setEndDate(null);
                  setShowEndDatePicker(false);
                }}
              >
                <Text style={styles.footerGhostButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.footerPrimaryButton} onPress={() => setShowEndDatePicker(false)}>
                <Text style={styles.footerPrimaryButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f6fb',
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOW.card,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  hint: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    paddingVertical: 12,
  },
  textAreaWrapper: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  textAreaInput: {
    minHeight: 90,
    color: COLORS.textPrimary,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  frequencyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  frequencyPill: {
    borderWidth: 1,
    borderColor: '#d7e1ec',
    backgroundColor: '#f8fafc',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  frequencyPillActive: {
    backgroundColor: '#d9f3ef',
    borderColor: COLORS.primary,
  },
  frequencyPillHover: {
    borderColor: COLORS.primaryLight,
  },
  frequencyPillPressed: {
    transform: [{ scale: 0.98 }],
  },
  frequencyPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  frequencyPillTextActive: {
    color: COLORS.primary,
  },
  timeList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#edf8f6',
    borderWidth: 1,
    borderColor: '#c3ece4',
  },
  timeChipHover: {
    borderColor: COLORS.primary,
  },
  timeChipText: {
    color: COLORS.primaryDark,
    fontSize: 12,
    fontWeight: '700',
  },
  addTimeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    backgroundColor: '#f0fbf8',
  },
  addTimeChipHover: {
    backgroundColor: '#e4f7f2',
  },
  addTimeChipPressed: {
    transform: [{ scale: 0.98 }],
  },
  addTimeChipText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  dateGrid: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  dateCell: {
    flex: 1,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    backgroundColor: '#f8fafc',
    paddingVertical: 11,
    paddingHorizontal: 10,
    gap: 8,
  },
  dateButtonText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  switchRow: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  switchHint: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  toggleSwitch: {
    width: 52,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#dbe2ea',
    justifyContent: 'center',
    padding: 2,
  },
  toggleSwitchActive: {
    backgroundColor: COLORS.primary,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.white,
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  submitButton: {
    marginTop: SPACING.xs,
    borderRadius: RADIUS.xl,
    paddingVertical: 14,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...SHADOW.cardElevated,
  },
  submitButtonHover: {
    backgroundColor: COLORS.primaryDark,
  },
  submitButtonPressed: {
    transform: [{ scale: 0.99 }],
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 430,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  dateModalCard: {
    width: '100%',
    maxWidth: 430,
    maxHeight: '82%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  timePickerContent: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.lg,
  },
  timeColumn: {
    flex: 1,
    maxHeight: 220,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
  },
  timeOption: {
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eff3f7',
  },
  timeOptionActive: {
    backgroundColor: '#d9f3ef',
  },
  timeOptionText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  timeOptionTextActive: {
    color: COLORS.primary,
  },
  timeSeparator: {
    fontSize: 24,
    color: COLORS.textSecondary,
    fontWeight: '700',
    marginTop: 12,
  },
  ampmColumn: {
    width: 70,
    gap: 8,
  },
  ampmButton: {
    flex: 1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  ampmButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  ampmText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  ampmTextActive: {
    color: COLORS.white,
  },
  dateList: {
    maxHeight: 330,
    padding: SPACING.md,
  },
  dateOption: {
    borderRadius: RADIUS.lg,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 6,
  },
  dateOptionActive: {
    backgroundColor: '#d9f3ef',
  },
  dateOptionText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  dateOptionTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  modalFooterRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerGhostButton: {
    flex: 1,
    paddingVertical: 13,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  footerGhostButtonText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  footerPrimaryButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerPrimaryButtonSingle: {
    margin: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  footerPrimaryButtonText: {
    color: COLORS.white,
    fontWeight: '700',
  },
});

export default AddMedicationScreen;
