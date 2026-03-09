import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import COLORS from '../utils/colors';
import { TYPOGRAPHY, SPACING, RADIUS, SHADOW } from '../utils/theme';
import { useTheme } from '../context/ThemeContext';
import ECGLogo from './ECGLogo';

const Header = ({
  title,
  subtitle,
  onBack,
  rightAction,
  style,
  showLogo,
  role,
  activeTab,
  navigation,
  user,
  onLogout,
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const { mode, toggleTheme } = useTheme();
  const isDashboard = !onBack && title;
  const displayFullNav = (showLogo === true || isDashboard) && role && user && navigation;

  const patientTabs = [
    { key: 'Dashboard', label: 'Dashboard' },
    { key: 'Schedule', label: 'Schedule' },
    
    { key: 'Vitals', label: 'My Vitals' },
  ];
  const doctorTabs = [
    { key: 'Home', label: 'Dashboard' },
    { key: 'Prescriptions', label: 'New Prescription' },
    { key: 'Patients', label: 'Patients' },
  ];
  const tabs = role === 'DOCTOR' ? doctorTabs : patientTabs;

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <SafeAreaView edges={['top']} style={[styles.wrapper, style]}>
      {displayFullNav ? (
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark, COLORS.primaryDarker]}
          style={styles.gradient}
        >
          <View style={styles.container}>
            <View style={styles.content}>
              <View style={styles.left}>
                <ECGLogo size={36} style={styles.ecg} />
                <Text style={styles.logoText}>MedLink</Text>
              </View>
              <View style={styles.navRow}>
                {tabs.map((tab) => (
                  <TouchableOpacity
                    key={tab.key}
                    onPress={() => navigation?.navigate(tab.key)}
                    style={styles.navLink}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.navText,
                        activeTab === tab.key && styles.navTextActive,
                      ]}
                    >
                      {tab.label}
                    </Text>
                    {activeTab === tab.key && <View style={styles.navUnderline} />}
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.right}>
                {rightAction}
                <TouchableOpacity 
                  style={styles.avatarContainer}
                  onPress={() => setMenuVisible(true)}
                  activeOpacity={0.8}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                  <Text style={styles.userName} numberOfLines={1}>
                    {user?.name || 'User'}
                  </Text>
                  <Text style={styles.dropdownIcon}>▼</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.greetingBlock}>
              <Text style={styles.greetingTitle} numberOfLines={1}>
                {title}
              </Text>
              {subtitle && (
                <Text style={styles.greetingSubtitle} numberOfLines={1}>
                  {subtitle}
                </Text>
              )}
            </View>
          </View>
        </LinearGradient>
      ) : (
        <View style={[styles.simpleBar, onBack && styles.simpleBarTeal]}>
          <View style={styles.container}>
            <View style={styles.content}>
              <View style={styles.left}>
                {onBack && (
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={onBack}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.backIcon}>←</Text>
                  </TouchableOpacity>
                )}
                <View>
                  <Text style={styles.title} numberOfLines={1}>
                    {title}
                  </Text>
                  {subtitle && (
                    <Text style={styles.subtitle} numberOfLines={1}>
                      {subtitle}
                    </Text>
                  )}
                </View>
              </View>
              {rightAction && <View style={styles.right}>{rightAction}</View>}
            </View>
          </View>
        </View>
      )}
      {/* Dropdown Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => setMenuVisible(false)}
          activeOpacity={1}
        >
          <View style={styles.menuContainer}>
            <View style={styles.menuHeader}>
              <View style={styles.menuAvatar}>
                <Text style={styles.menuAvatarText}>{initials}</Text>
              </View>
              <View>
                <Text style={styles.menuUserName}>{user?.name || 'User'}</Text>
                <Text style={styles.menuUserRole}>{role === 'DOCTOR' ? 'Doctor' : 'Patient'}</Text>
              </View>
            </View>
            
            <View style={styles.menuDivider} />
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                navigation?.navigate('Profile');
              }}
            >
              <Text style={styles.menuIcon}>👤</Text>
              <Text style={styles.menuText}>Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                navigation?.navigate('Settings');
              }}
            >
              <Text style={styles.menuIcon}>⚙️</Text>
              <Text style={styles.menuText}>Settings</Text>
            </TouchableOpacity>
            
            {role === 'PATIENT' && (
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  navigation?.navigate('Vitals');
                }}
              >
                <Text style={styles.menuIcon}>🩺</Text>
                <Text style={styles.menuText}>My Vitals</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                toggleTheme?.();
              }}
            >
              <Text style={styles.menuIcon}>{mode === 'dark' ? '☀️' : '🌙'}</Text>
              <Text style={styles.menuText}>
                {mode === 'dark' ? 'Daylight Mode' : 'Dark Mode'}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.menuDivider} />
            
            <TouchableOpacity 
              style={[styles.menuItem, styles.logoutItem]}
              onPress={() => {
                setMenuVisible(false);
                onLogout?.();
              }}
            >
              <Text style={styles.menuIcon}>🚪</Text>
              <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrapper: {},
  gradient: {
    paddingBottom: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  simpleBar: {
    backgroundColor: COLORS.background,
  },
  simpleBarTeal: {
    backgroundColor: COLORS.primary,
  },
  container: {
    paddingHorizontal: SPACING.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ecg: {
    marginRight: SPACING.sm,
  },
  logoText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.md,
  },
  navLink: {
    marginHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  navText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.9,
  },
  navTextActive: {
    opacity: 1,
    fontWeight: '600',
  },
  navUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.white,
    borderRadius: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  userName: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    maxWidth: 100,
  },
  dropdownIcon: {
    color: COLORS.white,
    fontSize: 10,
    marginLeft: SPACING.xs,
    opacity: 0.8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 80,
    paddingRight: SPACING.lg,
  },
  menuContainer: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    minWidth: 220,
    ...SHADOW.cardElevated,
    overflow: 'hidden',
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.primaryLight + '20',
  },
  menuAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  menuAvatarText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  menuUserName: {
    ...TYPOGRAPHY.label,
    color: COLORS.textPrimary,
  },
  menuUserRole: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  menuIcon: {
    fontSize: 18,
    marginRight: SPACING.md,
    width: 24,
  },
  menuText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  logoutItem: {
    backgroundColor: COLORS.dangerLight + '30',
  },
  logoutText: {
    color: COLORS.danger,
  },
  backButton: {
    marginRight: SPACING.md,
    padding: SPACING.xs,
  },
  backIcon: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '700',
  },
  title: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: COLORS.primaryLight,
    fontSize: 13,
    marginTop: 2,
  },
  greetingBlock: {
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
  },
  greetingTitle: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '700',
  },
  greetingSubtitle: {
    color: COLORS.primaryLight,
    fontSize: 14,
    marginTop: 4,
  },
});

export default Header;
