import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import COLORS from '../utils/colors';
import { TYPOGRAPHY } from '../utils/theme';
import ECGLogo from '../components/ECGLogo';

const SplashScreen = () => {
  const opacity = new Animated.Value(0);
  const scale = new Animated.Value(0.8);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>
        <View style={styles.logoIcon}>
          <ECGLogo size={80} />
        </View>
        <Text style={styles.name}>MedLink</Text>
        <Text style={styles.tagline}>Your Health, Managed Smartly</Text>
      </Animated.View>
      <Text style={styles.version}>v1.0.0</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { alignItems: 'center' },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  name: {
    fontSize: 42,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.primaryLight,
    marginTop: 12,
  },
  version: {
    position: 'absolute',
    bottom: 48,
    color: COLORS.primaryLight,
    ...TYPOGRAPHY.caption,
  },
});

export default SplashScreen;
