import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import DoctorDashboard from '../screens/doctor/DoctorDashboard';
import CreatePrescription from '../screens/doctor/CreatePrescription';
import PatientList from '../screens/doctor/PatientList';
import PatientSearchScreen from '../screens/doctor/PatientSearchScreen';
import AddPatientScreen from '../screens/doctor/AddPatientScreen';
import DoctorProfileScreen from '../screens/doctor/DoctorProfileScreen';
import DoctorViewProfileScreen from '../screens/doctor/DoctorViewProfileScreen';
import COLORS from '../utils/colors';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const DashboardStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="DoctorDashboard" component={DoctorDashboard} />
    <Stack.Screen name="CreatePrescription" component={CreatePrescription} />
    <Stack.Screen name="PatientList" component={PatientList} />
    <Stack.Screen name="AddPatient" component={AddPatientScreen} />
    <Stack.Screen name="PatientSearch" component={PatientSearchScreen} />
    <Stack.Screen name="Profile" component={DoctorViewProfileScreen} />
    <Stack.Screen name="EditProfile" component={DoctorProfileScreen} />
  </Stack.Navigator>
);

const DoctorNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.textLight,
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '600',
      },
      tabBarStyle: {
        borderTopWidth: 1,
        borderTopColor: COLORS.borderLight,
        backgroundColor: COLORS.card,
        paddingBottom: 8,
        paddingTop: 8,
        height: 64,
        elevation: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      tabBarIcon: ({ focused }) => {
        const icons = { Home: '🏥', Patients: '👥', Search: '🔍', Prescriptions: '📋' };
        return (
          <Text
            style={{
              fontSize: 22,
              opacity: focused ? 1 : 0.6,
            }}
          >
            {icons[route.name]}
          </Text>
        );
      },
    })}
  >
    <Tab.Screen name="Home" component={DashboardStack} />
    <Tab.Screen name="Patients" component={PatientList} />
    <Tab.Screen name="Search" component={PatientSearchScreen} />
    <Tab.Screen
      name="Prescriptions"
      component={CreatePrescription}
      options={{ tabBarLabel: 'New Rx' }}
    />
  </Tab.Navigator>
);

export default DoctorNavigator;
