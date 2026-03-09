import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import PatientDashboard from '../screens/patient/PatientDashboard';
import MedicationSchedule from '../screens/patient/MedicationSchedule';
import IntakeLog from '../screens/patient/IntakeLog';
import ReminderScreen from '../screens/patient/ReminderScreen';
import VitalsScreen from '../screens/patient/VitalsScreen';
import ReportsScreen from '../screens/patient/ReportsScreen';
import RemindersScreen from '../screens/patient/RemindersScreen';
import COLORS from '../utils/colors';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const DashboardStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="PatientDashboard" component={PatientDashboard} />
    <Stack.Screen name="Vitals" component={VitalsScreen} />
    <Stack.Screen name="Reports" component={ReportsScreen} />
    <Stack.Screen name="Reminders" component={RemindersScreen} />
  </Stack.Navigator>
);

const PatientNavigator = () => (
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
        const icons = {
          Dashboard: '🏠',
          Schedule: '📅',
          Vitals: '🩺',
          History: '📊',
          Reports: '📈',
          Reminders: '🔔',
        };
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
    <Tab.Screen name="Dashboard" component={DashboardStack} />
    <Tab.Screen name="Schedule" component={MedicationSchedule} />
    <Tab.Screen name="Vitals" component={VitalsScreen} />
    <Tab.Screen name="History" component={ReportsScreen} />
    <Tab.Screen name="Reminders" component={RemindersScreen} />
  </Tab.Navigator>
);

export default PatientNavigator;
