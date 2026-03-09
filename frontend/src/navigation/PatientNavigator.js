import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import PatientDashboard from '../screens/patient/PatientDashboard';
import MedicationSchedule from '../screens/patient/MedicationSchedule';
import IntakeLog from '../screens/patient/IntakeLog';
import ReminderScreen from '../screens/patient/ReminderScreen';
import VitalsScreen from '../screens/patient/VitalsScreen';
import RemindersScreen from '../screens/patient/RemindersScreen';
import AddMedicationScreen from '../screens/patient/AddMedicationScreen';
import PatientProfileScreen from '../screens/patient/PatientProfileScreen';
import EditPatientDetailsScreen from '../screens/patient/EditPatientDetailsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const DashboardStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="PatientDashboard" component={PatientDashboard} />
    <Stack.Screen name="Vitals" component={VitalsScreen} />
    <Stack.Screen name="Reminders" component={RemindersScreen} />
    <Stack.Screen name="AddMedication" component={AddMedicationScreen} />
    <Stack.Screen name="Profile" component={PatientProfileScreen} />
    <Stack.Screen name="Settings" component={EditPatientDetailsScreen} />
    <Stack.Screen name="Schedule" component={MedicationSchedule} />
  </Stack.Navigator>
);

const iconForRoute = (routeName, focused, colors) => {
  const color = focused ? colors.primary : colors.textLight;
  const size = 22;

  switch (routeName) {
    case 'Dashboard':
      return <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />;
    case 'Schedule':
      return <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={size} color={color} />;
    case 'Vitals':
      return <Ionicons name={focused ? 'pulse' : 'pulse-outline'} size={size} color={color} />;
    case 'Reminders':
      return <Ionicons name={focused ? 'notifications' : 'notifications-outline'} size={size} color={color} />;
    default:
      return <Ionicons name="ellipse-outline" size={size} color={color} />;
  }
};

const PatientNavigator = () => {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textLight,
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '600',
      },
      tabBarStyle: {
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
        backgroundColor: colors.card,
        paddingBottom: 8,
        paddingTop: 8,
        height: 68,
        elevation: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      tabBarIcon: ({ focused }) => iconForRoute(route.name, focused, colors),
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardStack} />
    <Tab.Screen name="Schedule" component={MedicationSchedule} />
    <Tab.Screen
      name="AddMedication"
      component={AddMedicationScreen}
      options={{
        tabBarLabel: '',
        tabBarIcon: () => null,
        tabBarButton: (props) => (
          <TouchableOpacity
            {...props}
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: colors.primary,
                justifyContent: 'center',
                alignItems: 'center',
                elevation: 6,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                marginBottom: 20,
              }}
            >
              <Ionicons name="add" size={30} color={colors.white} />
            </View>
          </TouchableOpacity>
        ),
      }}
    />
    <Tab.Screen name="Vitals" component={VitalsScreen} />
    <Tab.Screen name="Reminders" component={RemindersScreen} />
    <Tab.Screen
      name="Profile"
      component={PatientProfileScreen}
      options={{ tabBarButton: () => null, tabBarStyle: { display: 'none' } }}
    />
    <Tab.Screen
      name="Settings"
      component={EditPatientDetailsScreen}
      options={{ tabBarButton: () => null, tabBarStyle: { display: 'none' } }}
    />
    <Tab.Screen
      name="IntakeLog"
      component={IntakeLog}
      options={{ tabBarButton: () => null, tabBarStyle: { display: 'none' } }}
    />
    <Tab.Screen
      name="ReminderScreen"
      component={ReminderScreen}
      options={{ tabBarButton: () => null, tabBarStyle: { display: 'none' } }}
    />
  </Tab.Navigator>
  );
};

export default PatientNavigator;
