// MedLink color system with light/dark mode support
export const LIGHT_COLORS = {
  // Primary Teal Scale
  primary: '#0f766e',
  primaryLight: '#14b8a6',
  primaryLighter: '#5eead4',
  primaryDark: '#115e59',
  primaryDarker: '#134e4a',
  primaryMuted: '#99f6e4',

  // Soft Gradient Colors
  gradientStart: '#0d9488',
  gradientEnd: '#0f766e',
  gradientDarkStart: '#115e59',
  gradientDarkEnd: '#134e4a',

  // Semantic Colors
  success: '#10b981',
  successLight: '#d1fae5',
  successDark: '#059669',

  warning: '#f59e0b',
  warningLight: '#fef3c7',
  warningDark: '#d97706',

  danger: '#ef4444',
  dangerLight: '#fee2e2',
  dangerDark: '#dc2626',

  info: '#3b82f6',
  infoLight: '#dbeafe',
  infoDark: '#2563eb',

  // Neutral Scale
  white: '#FFFFFF',
  background: '#f8fafc',
  backgroundAlt: '#f1f5f9',
  card: '#FFFFFF',
  cardAlt: '#f8fafc',

  // Text Colors
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textTertiary: '#64748b',
  textLight: '#94a3b8',
  textMuted: '#cbd5e1',

  // Border & Divider
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  divider: '#e2e8f0',

  // Status Colors
  statusActive: '#10b981',
  statusCompleted: '#64748b',
  statusCancelled: '#ef4444',
  statusPending: '#f59e0b',
  statusExpiring: '#f97316',

  // Medication Status
  taken: '#10b981',
  missed: '#ef4444',
  skipped: '#f59e0b',
  pending: '#94a3b8',

  // Health Score Colors
  healthGood: '#10b981',
  healthModerate: '#f59e0b',
  healthRisk: '#ef4444',

  // Vitals Colors
  bpNormal: '#10b981',
  bpElevated: '#f59e0b',
  bpHigh: '#ef4444',

  // Shadows
  shadow: 'rgba(15, 23, 42, 0.08)',
  shadowDark: 'rgba(15, 23, 42, 0.15)',

  // Legacy aliases
  secondary: '#10b981',
  secondaryLight: '#d1fae5',
  accent: '#f59e0b',
  accentLight: '#fef3c7',
  accentBlue: '#3b82f6',
  accentBlueLight: '#dbeafe',
};

export const DARK_COLORS = {
  ...LIGHT_COLORS,
  background: '#0b1220',
  backgroundAlt: '#121a2b',
  card: '#172033',
  cardAlt: '#1f2a40',
  textPrimary: '#e2e8f0',
  textSecondary: '#94a3b8',
  textTertiary: '#7a8ba6',
  textLight: '#64748b',
  textMuted: '#475569',
  border: '#27344c',
  borderLight: '#1d283c',
  divider: '#27344c',
  shadow: 'rgba(0, 0, 0, 0.5)',
  shadowDark: 'rgba(0, 0, 0, 0.7)',
};

export const getColors = (mode = 'light') => (mode === 'dark' ? DARK_COLORS : LIGHT_COLORS);

export const COLORS = LIGHT_COLORS;
export default COLORS;
