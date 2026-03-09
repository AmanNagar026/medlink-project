import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import medicationService from '../../services/medicationService';
import COLORS from '../../utils/colors';
import { formatDateTime, getStatusColor } from '../../utils/helpers';
import { SPACING, TYPOGRAPHY, RADIUS, SHADOW } from '../../utils/theme';

const IntakeLog = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [history, setHistory] = useState([]);

  const load = async () => {
    if (!user?.profileId) return;
    try {
      const data = await medicationService.getIntakeHistory(user.profileId);
      const sorted = data.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setHistory(sorted);
    } catch (err) {
      console.error(err);
    }
  };

  useFocusEffect(useCallback(() => {
    load();
  }, []));

  const renderItem = ({ item }) => {
    const statusColor = getStatusColor(item.status);
    return (
      <View style={styles.card}>
        <View style={[styles.statusBar, { backgroundColor: statusColor }]} />
        <View style={styles.details}>
          <Text style={styles.medName}>{item.medicationName}</Text>
          <Text style={styles.time}>
            {item.scheduledDate} at {item.scheduledTime}
          </Text>
          {item.takenAt && (
            <Text style={styles.takenAt}>
              Taken: {formatDateTime(item.takenAt)}
            </Text>
          )}
        </View>
        <View style={[styles.badge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.badgeText, { color: statusColor }]}>
            {item.status}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Intake History"
        subtitle=""
        role="PATIENT"
        activeTab="History"
        navigation={navigation}
        user={user}
        onLogout={logout}
      />
      <FlatList
        data={history}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No intake history yet</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  listContent: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...SHADOW.card,
  },
  statusBar: {
    width: 5,
    height: '100%',
    minHeight: 64,
  },
  details: { flex: 1, padding: SPACING.lg },
  medName: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
  },
  time: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  takenAt: {
    fontSize: 11,
    color: COLORS.secondary,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    marginRight: SPACING.md,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  empty: {
    alignItems: 'center',
    padding: SPACING.xxxl,
  },
  emptyIcon: { fontSize: 44, marginBottom: SPACING.sm },
  emptyText: {
    color: COLORS.textSecondary,
    ...TYPOGRAPHY.body,
  },
});

export default IntakeLog;
