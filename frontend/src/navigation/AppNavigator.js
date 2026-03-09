import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AuthNavigator from './AuthNavigator';
import DoctorNavigator from './DoctorNavigator';
import PatientNavigator from './PatientNavigator';
import SplashScreen from '../screens/SplashScreen';

const AppNavigator = () => {
  const { user, loading } = useAuth();
  const { colors, isDark } = useTheme();

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer
      theme={{
        dark: isDark,
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.card,
          text: colors.textPrimary,
          border: colors.border,
          notification: colors.danger,
        },
      }}
    >
      {!user ? (
        <AuthNavigator />
      ) : user.role === 'DOCTOR' ? (
        <DoctorNavigator />
      ) : (
        <PatientNavigator />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
