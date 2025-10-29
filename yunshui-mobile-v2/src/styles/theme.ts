import { MD3LightTheme } from 'react-native-paper';
import { responsive, spacing, touchTarget, deviceInfo, responsiveValue } from '../utils/responsive';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#007bff',
    secondary: '#6c757d',
    surface: '#ffffff',
    background: '#f0f8ff',
    error: '#dc3545',
    success: '#28a745',
    warning: '#ffc107',
    info: '#17a2b8',
  },
};

// 響應式字體系統
export const typography = {
  // 標題字體
  h1: {
    fontSize: responsive.fontSize(28),
    fontWeight: 'bold' as const,
    lineHeight: responsive.fontSize(36),
  },
  h2: {
    fontSize: responsive.fontSize(24),
    fontWeight: 'bold' as const,
    lineHeight: responsive.fontSize(32),
  },
  h3: {
    fontSize: responsive.fontSize(20),
    fontWeight: '600' as const,
    lineHeight: responsive.fontSize(28),
  },
  h4: {
    fontSize: responsive.fontSize(18),
    fontWeight: '600' as const,
    lineHeight: responsive.fontSize(24),
  },
  
  // 內文字體
  body1: {
    fontSize: responsive.fontSize(16),
    fontWeight: 'normal' as const,
    lineHeight: responsive.fontSize(24),
  },
  body2: {
    fontSize: responsive.fontSize(14),
    fontWeight: 'normal' as const,
    lineHeight: responsive.fontSize(20),
  },
  
  // 小字體
  caption: {
    fontSize: responsive.fontSize(12),
    fontWeight: 'normal' as const,
    lineHeight: responsive.fontSize(16),
  },
  
  // 按鈕字體
  button: {
    fontSize: responsive.fontSize(16),
    fontWeight: '600' as const,
    lineHeight: responsive.fontSize(20),
  },
};

// 響應式佈局系統
export const layout = {
  // 容器
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  // 內容區域
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  
  // 安全區域
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  // 卡片佈局
  card: {
    marginHorizontal: spacing.sm,
    marginVertical: spacing.xs,
    padding: spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: responsive.scale(12),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  // 列表項目
  listItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: touchTarget.recommended,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  
  // 表單佈局
  formContainer: {
    padding: spacing.md,
  },
  
  formField: {
    marginBottom: spacing.md,
  },
  
  // 按鈕佈局
  buttonContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  
  button: {
    minHeight: touchTarget.recommended,
    marginVertical: spacing.xs,
    borderRadius: responsive.scale(8),
  },
  
  // 響應式網格
  grid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    marginHorizontal: -spacing.xs,
  },
  
  gridItem: responsiveValue({
    small: { width: '100%', paddingHorizontal: spacing.xs },
    medium: { width: '50%', paddingHorizontal: spacing.xs },
    large: { width: '50%', paddingHorizontal: spacing.xs },
    tablet: { width: '33.333%', paddingHorizontal: spacing.xs },
    default: { width: '100%', paddingHorizontal: spacing.xs },
  }),
};

// 響應式間距
export const margins = {
  xs: { margin: spacing.xs },
  sm: { margin: spacing.sm },
  md: { margin: spacing.md },
  lg: { margin: spacing.lg },
  xl: { margin: spacing.xl },
  
  // 垂直間距
  vertical: {
    xs: { marginVertical: spacing.xs },
    sm: { marginVertical: spacing.sm },
    md: { marginVertical: spacing.md },
    lg: { marginVertical: spacing.lg },
    xl: { marginVertical: spacing.xl },
  },
  
  // 水平間距
  horizontal: {
    xs: { marginHorizontal: spacing.xs },
    sm: { marginHorizontal: spacing.sm },
    md: { marginHorizontal: spacing.md },
    lg: { marginHorizontal: spacing.lg },
    xl: { marginHorizontal: spacing.xl },
  },
};

export const paddings = {
  xs: { padding: spacing.xs },
  sm: { padding: spacing.sm },
  md: { padding: spacing.md },
  lg: { padding: spacing.lg },
  xl: { padding: spacing.xl },
  
  // 垂直內距
  vertical: {
    xs: { paddingVertical: spacing.xs },
    sm: { paddingVertical: spacing.sm },
    md: { paddingVertical: spacing.md },
    lg: { paddingVertical: spacing.lg },
    xl: { paddingVertical: spacing.xl },
  },
  
  // 水平內距
  horizontal: {
    xs: { paddingHorizontal: spacing.xs },
    sm: { paddingHorizontal: spacing.sm },
    md: { paddingHorizontal: spacing.md },
    lg: { paddingHorizontal: spacing.lg },
    xl: { paddingHorizontal: spacing.xl },
  },
};

// 設備特定樣式
export const deviceStyles = {
  // 小螢幕設備
  small: {
    container: {
      paddingHorizontal: spacing.sm,
    },
    text: {
      fontSize: responsive.fontSize(14),
    },
  },
  
  // 平板設備
  tablet: {
    container: {
      paddingHorizontal: spacing.xl,
      maxWidth: 768,
      alignSelf: 'center' as const,
    },
    grid: {
      marginHorizontal: -spacing.md,
    },
  },
};

// 向後兼容的 commonStyles
export const commonStyles = {
  container: layout.container,
  content: layout.content,
  card: layout.card,
  button: layout.button,
  title: { ...typography.h3, color: '#333', marginBottom: spacing.md },
  subtitle: { ...typography.h4, color: '#555', marginBottom: spacing.sm },
  text: { ...typography.body2, color: '#666' },
};