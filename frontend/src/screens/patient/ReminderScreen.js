import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import COLORS from '../../utils/colors';
import { SPACING, TYPOGRAPHY, RADIUS, SHADOW } from '../../utils/theme';

const ReminderScreen = ({ navigation }) => {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Header
        title="My Info"
        subtitle="Medication reminders"
        role="PATIENT"
        activeTab="Reminders"
        navigation={navigation}
        user={user}
        onLogout={logout}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.icon}>🔔</Text>
          <Text style={styles.title}>Medication Reminders</Text>
          <Text style={styles.desc}>
            Push notifications will be sent for each scheduled medication. Make
            sure notifications are enabled in your device settings.
          </Text>
          <View style={styles.tip}>
            <Text style={styles.tipText}>
              💡 You will receive reminders 15 minutes before each scheduled
              dose.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.xxl,
    alignItems: 'center',
    ...SHADOW.card,
  },
  icon: { fontSize: 64, marginBottom: SPACING.xl },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  desc: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  tip: {
    marginTop: SPACING.xxl,
    backgroundColor: COLORS.primaryLight + '50',
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    alignSelf: 'stretch',
  },
  tipText: {
    color: COLORS.primary,
    ...TYPOGRAPHY.bodySmall,
  },
});

export default ReminderScreen;
