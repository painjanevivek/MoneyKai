import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Responsive layout helper.
 * - Mobile (<768): full width
 * - Tablet (768–1024): centered 600px container
 * - Desktop (>1024): centered 420px phone-width container
 */
export const getResponsiveWidth = (): number => {
  if (Platform.OS === 'web') {
    if (SCREEN_WIDTH > 1024) return 420;
    if (SCREEN_WIDTH > 768) return 600;
  }
  return SCREEN_WIDTH;
};

export const isDesktop = (): boolean => Platform.OS === 'web' && SCREEN_WIDTH > 1024;
export const isTablet = (): boolean => Platform.OS === 'web' && SCREEN_WIDTH > 768 && SCREEN_WIDTH <= 1024;
export const isMobile = (): boolean => Platform.OS !== 'web' || SCREEN_WIDTH <= 768;

export const getContainerStyle = () => ({
  maxWidth: getResponsiveWidth(),
  width: '100%' as const,
  alignSelf: 'center' as const,
});
