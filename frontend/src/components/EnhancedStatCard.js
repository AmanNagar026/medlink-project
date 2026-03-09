import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import COLORS from '../utils/colors';
import { SPACING, SHADOW } from '../utils/theme';

/**
 * Enhanced Stat Card Component
 * Individual stat card with gradient background, large numbers, and animations
 */
const EnhancedStatCard = ({
  title,
  value,
  subtitle,
  icon,
  gradientColors,
  onPress,
  style,
  alert = false,
  size = 'medium', // 'small', 'medium', 'large'
  animatedValue, // for value change animations
}) => {
  // Default gradient if not provided
  const defaultGradient = ['#0f766e', '#115e59'];
  const colors = gradientColors || defaultGradient;

  const sizeStyles = {
    small: { 
      padding: SPACING.md, 
      minWidth: 100,
      minHeight: 100 
    },
    medium: { 
      padding: SPACING.lg, 
      minWidth: 140,
      minHeight: 140 
    },
    large: { 
      padding: SPACING.xl, 
      minWidth: 180,
      minHeight: 180 
    },
  };

  // Animation scale for press effect
  const scaleValue = new Animated.Value(1);
  
  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
      friction: 3,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      friction: 3,
    }).start();
  };

  const animatedStyle = {
    transform: [{ scale: scaleValue }],
  };

  return (
    <Animated.View
      style={[styles.container, sizeStyles[size], style, animatedStyle]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        style={styles.touchContainer}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, alert && styles.alertBorder]}
        >
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>{icon}</Text>
            </View>
            <Text style={styles.value} numberOfLines={1}>
              {value}
            </Text>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {subtitle && (
              <Text style={styles.subtitle} numberOfLines={2}>
                {subtitle}
              </Text>
            )}
          </View>
          {alert && (
            <View style={styles.alertIndicator} />
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    ...SHADOW.card,
    overflow: 'hidden',
  },
  touchContainer: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    borderRadius: 16,
    padding: SPACING.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  icon: {
    fontSize: 24,
    textAlign: 'center',
  },
  value: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 16,
  },
  alertBorder: {
    borderWidth: 2,
    borderColor: '#f59e0b',
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
});

export default EnhancedStatCard;