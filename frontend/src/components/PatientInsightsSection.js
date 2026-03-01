import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import COLORS from '../utils/colors';
import { SPACING, SHADOW } from '../utils/theme';

/**
 * Enhanced Patient Insights Section Component
 * Displays patient cards with full details, icons, and status information
 */
const PatientInsightsSection = ({ 
  patients = [], 
  prescriptions = [],
  onPressPatient,
  loading = false,
  style,
  showViewAll = true,
  onViewAll,
  emptyMessage = "No patients yet"
}) => {
  // Get patient stats for insights
  const getPatientStats = (patientId, prescriptions = []) => {
    const patientRx = prescriptions.filter(p => p.patientId === patientId);
    const activeCount = patientRx.filter(p => p.status === 'ACTIVE').length;
    const adherence = patientRx.length > 0 
      ? Math.round((activeCount / patientRx.length) * 100)
      : 0;
    const status = patientRx.length === 0 ? 'New' : (adherence >= 80 ? 'Active' : adherence >= 50 ? 'Moderate' : 'Needs attention');
    return { activeCount, adherence, totalRx: patientRx.length, status };
  };

  // Get gender icon
  const getGenderIcon = (gender) => {
    const g = (gender || '').toLowerCase();
    if (g === 'male') return '👨';
    if (g === 'female') return '👩';
    return '👤';
  };

  // Get adherence badge style
  const getAdherenceStyle = (adherence) => {
    if (adherence >= 80) return { bg: '#dcfce7', text: '#16a34a' };
    if (adherence >= 50) return { bg: '#fef3c7', text: '#d97706' };
    return { bg: '#fee2e2', text: '#dc2626' };
  };

  if (loading) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.sectionTitle}>Patient Insights</Text>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading patient data...</Text>
        </View>
      </View>
    );
  }

  if (patients.length === 0) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.sectionTitle}>Patient Insights</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
          {showViewAll && onViewAll && (
            <TouchableOpacity style={styles.emptyButton} onPress={onViewAll}>
              <Text style={styles.emptyButtonText}>Add First Patient</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Patient Insights</Text>
        {showViewAll && onViewAll && patients.length > 5 && (
          <TouchableOpacity onPress={onViewAll}>
            <Text style={styles.viewAllLink}>View All ›</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.patientsList}>
        {patients.slice(0, 5).map((patient, index) => {
          const stats = getPatientStats(patient.id || patient._id, prescriptions);
          const conditions = patient.chronicConditions || [];
          const adherenceStyle = getAdherenceStyle(stats.adherence);
          const statusBadgeBg = stats.status === 'New' ? '#e0e7ff' : adherenceStyle.bg;
          const statusBadgeText = stats.status === 'New' ? '#4f46e5' : adherenceStyle.text;
          
          return (
            <TouchableOpacity 
              key={patient.id || patient._id || index} 
              style={styles.patientCard}
              onPress={() => onPressPatient && onPressPatient(patient)}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getGenderIcon(patient.gender)}</Text>
                </View>
                <View style={styles.patientInfo}>
                  <Text style={styles.patientName} numberOfLines={1}>
                    {patient.name}
                  </Text>
                  <Text style={styles.patientMeta} numberOfLines={1}>
                    {patient.gender || 'Unknown'} • {patient.dateOfBirth ? 
                      `${new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} yrs` : 
                      patient.age ? `${patient.age} yrs` : 'Age unknown'}
                  </Text>
                  {patient.phoneNumber && (
                    <Text style={styles.contactInfo} numberOfLines={1}>
                      {`📞 ${patient.phoneNumber}`}
                    </Text>
                  )}
                  {patient.email && (
                    <Text style={styles.contactInfo} numberOfLines={1}>
                      {`✉️ ${patient.email}`}
                    </Text>
                  )}
                </View>
                <View style={[styles.adherenceBadge, { backgroundColor: statusBadgeBg }]}>
                  <Text style={[styles.adherenceText, { color: statusBadgeText }]}>
                    {stats.status === 'New' ? stats.status : `${stats.adherence}%`}
                  </Text>
                </View>
              </View>
              
              {conditions.length > 0 && (
                <View style={styles.conditionsContainer}>
                  <Text style={styles.conditionsLabel}>Conditions:</Text>
                  <View style={styles.conditionsList}>
                    {conditions.slice(0, 2).map((condition, i) => (
                      <View key={i} style={styles.conditionTag}>
                        <Text style={styles.conditionText}>{condition}</Text>
                      </View>
                    ))}
                    {conditions.length > 2 && (
                      <Text style={styles.moreConditions}>
                        +{conditions.length - 2} more
                      </Text>
                    )}
                  </View>
                </View>
              )}
              
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.activeCount}</Text>
                  <Text style={styles.statLabel}>Active Rx</Text>
                </View>
                <View style={styles.statSeparator}>
                  <Text style={styles.statSeparatorText}>•</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.totalRx}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
                {patient.bloodGroup && (
                  <>
                    <View style={styles.statSeparator}>
                      <Text style={styles.statSeparatorText}>•</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{patient.bloodGroup}</Text>
                      <Text style={styles.statLabel}>Blood</Text>
                    </View>
                  </>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      
      {showViewAll && onViewAll && patients.length > 5 && (
        <View style={styles.viewAllContainer}>
          <TouchableOpacity style={styles.viewAllButton} onPress={onViewAll}>
            <Text style={styles.viewAllText}>View All {patients.length} Patients ›</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  viewAllLink: {
    fontSize: 14,
    color: '#0f766e',
    fontWeight: '600',
  },
  patientsList: {
    gap: SPACING.md,
  },
  patientCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    ...SHADOW.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 20,
  },
  patientInfo: {
    flex: 1,
    marginRight: 10,
  },
  patientName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  patientMeta: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 2,
  },
  contactInfo: {
    fontSize: 11,
    color: '#0f766e',
    fontWeight: '500',
  },
  adherenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  adherenceText: {
    fontSize: 12,
    fontWeight: '700',
  },
  conditionsContainer: {
    marginBottom: 10,
  },
  conditionsLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 6,
  },
  conditionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  conditionTag: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  conditionText: {
    fontSize: 10,
    color: '#92400e',
    fontWeight: '500',
  },
  moreConditions: {
    fontSize: 10,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  statSeparator: {
    marginHorizontal: 8,
  },
  statSeparatorText: {
    fontSize: 12,
    color: '#cbd5e1',
  },
  loadingContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    ...SHADOW.card,
  },
  loadingText: {
    fontSize: 15,
    color: '#64748b',
  },
  emptyContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    ...SHADOW.card,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#0f766e',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  viewAllContainer: {
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  viewAllButton: {
    paddingVertical: 12,
  },
  viewAllText: {
    fontSize: 13,
    color: '#0f766e',
    fontWeight: '600',
  },
});

export default PatientInsightsSection;