import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * MedLink Logo - Circular teal gradient background with white "M" letter.
 */
const ECGLogo = ({ size = 80, style }) => {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <LinearGradient
        colors={['#2A9D8F', '#1D7A6E']}
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          }
        ]}
      >
        <Text style={[styles.letter, { fontSize: size * 0.5 }]}>M</Text>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  letter: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontFamily: 'System',
  },
});

export default ECGLogo;
