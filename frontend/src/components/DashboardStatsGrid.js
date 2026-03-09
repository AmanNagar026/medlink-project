import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import COLORS from '../utils/colors';
import { SPACING, SHADOW } from '../utils/theme';

const { width } = Dimensions.get('window');

/**
 * Dashboard Stats Grid Component
 * Responsive grid layout for stat cards with proper spacing and equal heights
 */
const DashboardStatsGrid = ({ 
  stats, 
  onCardPress,
  loading = false,
  error = null,
  onRetry 
}) => {
  // Determine layout based on screen width
  const isTablet = width >= 768;
  const cardsPerRow = isTablet ? 4 : 2;
  
  // Card configuration with gradients and icons
  const statCards = [
    {
      key: 'totalPatients',
      label: 'Total Patients',
      icon: '👥',
      gradient: ['#0f766e', '#115e59'],
      subtitle: 'All registered patients',
      color: '#0f766e'
    },
    {
      key: 'activePrescriptions',
      label: 'Active Rx',
      icon: '💊',
      gradient: ['#10b981', '#059669'],
      subtitle: 'Currently active',
      color: '#10b981'
    },
    {
      key: 'completedPrescriptions',
      label: 'Completed',
      icon: '✓',
      gradient: ['#3b82f6', '#2563eb'],
      subtitle: 'Successfully completed',
      color: '#3b82f6'
    },
    {
      key: 'expiringSoon',
      label: 'Expiring Soon',
      icon: '⏰',
      gradient: ['#f59e0b', '#d97706'],
      subtitle: 'Within 7 days',
      color: '#f59e0b',
      alert: true
    }
  ];

  if (loading) {
    return (
      <View style={styles.gridContainer}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading dashboard stats...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.gridContainer}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          {onRetry && (
            <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.gridContainer}>
      <View style={[styles.grid, { flexDirection: isTablet ? 'row' : 'row' }]}>
        {statCards.map((card, index) => (
          <View 
            key={card.key} 
            style={[
              styles.cardWrapper,
              { 
                width: `${100 / cardsPerRow}%`,
                marginBottom: isTablet ? SPACING.md : SPACING.lg,
                paddingHorizontal: isTablet ? SPACING.sm : SPACING.md
              }
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onCardPress && onCardPress(card.key)}
              style={styles.cardTouchContainer}
            >
              <LinearGradient
                colors={card.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.statCard,
                  card.alert && styles.alertBorder
                ]}
              >
                <View style={styles.cardContent}>
                  <View style={styles.iconContainer}>
                    <Text style={styles.statIcon}>{card.icon}</Text>
                  </View>
                  <Text style={styles.statValue}>
                    {stats[card.key] || 0}
                  </Text>
                  <Text style={styles.statLabel}>{card.label}</Text>
                  <Text style={styles.statSubtitle}>{card.subtitle}</Text>
                </View>
                {card.alert && stats[card.key] > 0 && (
                  <View style={styles.alertIndicator} />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    width: '100%',
    marginBottom: SPACING.lg,
  },
  grid: {
    flexWrap: 'wrap',
  },
  cardWrapper: {
    alignItems: 'center',
  },
  cardTouchContainer: {
    width: '100%',
  },
  statCard: {
    borderRadius: 16,
    padding: SPACING.lg,
    minHeight: 140,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW.card,
    position: 'relative',
    overflow: 'hidden',
  },
  alertBorder: {
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  iconContainer: {
    marginBottom: SPACING.sm,
  },
  statIcon: {
    fontSize: 32,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    fontWeight: '500',
  },
  alertIndicator: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#f59e0b',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    ...SHADOW.card,
  },
  loadingText: {
    marginLeft: SPACING.md,
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    ...SHADOW.card,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  errorIcon: {
    fontSize: 24,
    marginBottom: SPACING.sm,
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  retryButton: {
    backgroundColor: '#0f766e',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default DashboardStatsGrid;