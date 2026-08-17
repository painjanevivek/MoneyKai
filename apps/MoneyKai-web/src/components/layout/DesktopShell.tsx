import React, { type PropsWithChildren, useEffect, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, usePathname } from 'expo-router';
import { Alert, Linking, Pressable, ScrollView, Text, View, type LayoutChangeEvent, type ViewStyle, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/theme';
import { AccountMenu } from '@/components/layout/AccountMenu';
import { ReportingMonthPicker } from '@/components/layout/ReportingMonthPicker';
import { glassBackdropStyle, withAlpha } from '@/utils/glassStyle';

type NavItem = {
  href: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

type NavLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'view-dashboard-outline' },
  { href: '/transactions', label: 'Transactions', icon: 'swap-horizontal' },
  { href: '/budgets', label: 'Budgets', icon: 'wallet-outline' },
  { href: '/accounts', label: 'Accounts', icon: 'credit-card-outline' },
  { href: '/goals', label: 'Goals', icon: 'target' },
  { href: '/reports', label: 'Reports', icon: 'chart-bar' },
] as const;

const MOBILE_APK_DOWNLOAD_URL: string | null = null;

const ROUTE_META: { href: string; title: string; subtitle: string; icon?: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { href: '/dashboard', title: 'Dashboard', subtitle: 'A clear overview of your money' },
  { href: '/transactions', title: 'Transactions', subtitle: 'Track income, expenses, and history' },
  { href: '/ai-review', title: 'AI Review', subtitle: 'Review receipt and image analysis before using it' },
  { href: '/budgets', title: 'Budgets', subtitle: 'Review monthly limits and budget health', icon: 'wallet-outline' },
  { href: '/goals', title: 'Goals', subtitle: 'Stay focused on savings progress' },
  { href: '/wealth', title: 'Wealth', subtitle: 'Net worth, allocation, and AI portfolio review' },
  { href: '/portfolio', title: 'Portfolio', subtitle: 'Track holdings, allocation, and account value in one place' },
  { href: '/reports', title: 'Reports', subtitle: 'Spot patterns in your spending' },
  { href: '/accounts', title: 'Accounts', subtitle: 'Linked balances, sync health, and account controls' },
  { href: '/categories', title: 'Categories', subtitle: 'See where money goes by category' },
  { href: '/groups', title: 'Groups', subtitle: 'Shared spending, settlements, and family context' },
  { href: '/learn-center', title: 'Learn Center', subtitle: 'Practical money guides for calmer decisions' },
  { href: '/notes', title: 'Notes', subtitle: 'Keep review context beside your records' },
  { href: '/notifications', title: 'Notifications', subtitle: 'Review alerts, reminders, and app updates' },
  { href: '/savings', title: 'Savings', subtitle: 'Track goals, streaks, and savings progress' },
  { href: '/subscriptions', title: 'Subscriptions', subtitle: '' },
  { href: '/settings', title: 'Settings', subtitle: 'Profile, privacy, and backups' },
];

function MoneyKaiBrandMark({ size }: { size: number }) {
  return (
    <Image
      source={{ uri: '/brand/moneykai-symbol-logo.svg' }}
      contentFit="contain"
      contentPosition="center"
      accessibilityIgnoresInvertColors
      style={{ width: Math.round(size * 0.68), height: Math.round(size * 0.68) }}
    />
  );
}

const normalizePath = (pathname: string) => pathname.replace('/(tabs)', '') || '/';

const isRouteActive = (pathname: string, href: string) => {
  const normalized = normalizePath(pathname);
  if (href === '/dashboard') return normalized === '/dashboard';
  return normalized === href || normalized.startsWith(`${href}/`);
};

function SlidingNavItems({ pathname, orientation }: { pathname: string; orientation: 'horizontal' | 'vertical' }) {
  const { colors } = useTheme();
  const [navLayouts, setNavLayouts] = useState<Record<string, NavLayout>>({});
  const activeItem = NAV_ITEMS.find((item) => isRouteActive(pathname, item.href));
  const isHorizontal = orientation === 'horizontal';
  const activeLayout = activeItem ? navLayouts[activeItem.href] : undefined;
  const indicatorStyle: ViewStyle = {
    opacity: activeLayout ? 1 : 0,
    width: activeLayout?.width ?? 0,
    height: activeLayout?.height ?? 0,
    transform: [
      { translateX: activeLayout?.x ?? 0 },
      { translateY: activeLayout?.y ?? 0 },
    ],
  };

  const handleNavItemLayout = (href: string) => (event: LayoutChangeEvent) => {
    const { x, y, width: itemWidth, height: itemHeight } = event.nativeEvent.layout;
    const next = {
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(itemWidth),
      height: Math.round(itemHeight),
    };

    setNavLayouts((current) => {
      const previous = current[href];
      if (
        previous &&
        previous.x === next.x &&
        previous.y === next.y &&
        previous.width === next.width &&
        previous.height === next.height
      ) {
        return current;
      }

      return {
        ...current,
        [href]: next,
      };
    });
  };

  return (
    <View
      style={{
        flexDirection: isHorizontal ? 'row' : 'column',
        gap: isHorizontal ? Spacing.xs : 4,
        paddingRight: isHorizontal ? Spacing.base : 0,
        marginBottom: isHorizontal ? 0 : Spacing.lg,
        position: 'relative',
      }}
    >
      <View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            borderRadius: isHorizontal ? BorderRadius.full : BorderRadius.md,
            backgroundColor: colors.primaryBg,
            borderWidth: 1,
            borderColor: withAlpha(colors.primary, 0.18),
          },
          indicatorStyle,
        ]}
      />

      {NAV_ITEMS.map((item) => {
        const active = item.href === activeItem?.href;
        return (
          <Pressable
            key={`${item.href}-${item.label}`}
            accessibilityRole="link"
            accessibilityLabel={`Open ${item.label}`}
            accessibilityState={{ selected: active }}
            aria-selected={active}
            onLayout={handleNavItemLayout(item.href)}
            onPress={() => router.push(item.href as any)}
            style={({ hovered, pressed }: any) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: isHorizontal ? 8 : 12,
              paddingHorizontal: isHorizontal ? Spacing.md : 14,
              paddingVertical: isHorizontal ? 10 : 10,
              borderRadius: isHorizontal ? BorderRadius.full : BorderRadius.md,
              backgroundColor: !active && hovered ? withAlpha(colors.primary, 0.08) : 'transparent',
              borderWidth: 1,
              borderColor: !active && hovered ? withAlpha(colors.primary, 0.18) : 'transparent',
              transform: hovered && !pressed
                ? [{ translateX: isHorizontal ? 0 : 2 }, { translateY: isHorizontal ? -1 : 0 }]
                : [{ translateX: 0 }, { translateY: 0 }],
              position: 'relative',
              zIndex: 1,
            })}
          >
            <MaterialCommunityIcons
              name={item.icon}
              size={isHorizontal ? 18 : 20}
              color={active ? colors.primary : colors.textSecondary}
            />
            <Text
              style={{
                fontSize: Typography.fontSize.sm,
                lineHeight: isHorizontal ? 20 : undefined,
                fontFamily: Typography.fontFamily.medium,
                color: active ? colors.primary : colors.textSecondary,
              }}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function DesktopShell({ children }: PropsWithChildren) {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const sidebarWidth = width >= 1440 ? 278 : 250;
  const activeMeta = ROUTE_META.find((item) => isRouteActive(pathname, item.href)) ?? ROUTE_META[0];
  const isCompact = width < 900;
  const sidebarHeight = Math.max(0, height - 20);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const scrollToTop = () => window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      scrollToTop();
      const frame = window.requestAnimationFrame(scrollToTop);
      const timer = window.setTimeout(scrollToTop, 50);
      return () => {
        window.cancelAnimationFrame(frame);
        window.clearTimeout(timer);
      };
    }

    return undefined;
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  const handleDownloadMobileApp = () => {
    if (!MOBILE_APK_DOWNLOAD_URL) {
      Alert.alert(
        'Mobile app coming soon',
        'The MoneyKai Android APK is still under development. This option will start the APK download once the file is ready.'
      );
      return;
    }

    Linking.openURL(MOBILE_APK_DOWNLOAD_URL).catch(() => {
      Alert.alert('Download unavailable', 'Could not start the MoneyKai APK download right now.');
    });
  };

  if (isCompact) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, backgroundColor: colors.background, overflow: 'hidden' }}>
          <View
            style={{
              borderBottomWidth: 1,
              borderBottomColor: colors.borderLight,
              backgroundColor: colors.background,
              paddingHorizontal: Spacing.base,
              paddingTop: Spacing.sm,
              paddingBottom: Spacing.md,
              gap: Spacing.md,
              position: 'relative',
              zIndex: 40,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md }}>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Go to MoneyKai dashboard"
                onPress={() => router.push('/dashboard' as any)}
                style={({ hovered, pressed }: any) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  flex: 1,
                  minWidth: 0,
                  padding: 6,
                  marginLeft: -6,
                  borderRadius: BorderRadius.lg,
                  backgroundColor: hovered ? `${colors.primary}0D` : 'transparent',
                  transform: hovered && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
                })}
              >
                <View
                  style={{
                  width: 42,
                  height: 42,
                  borderRadius: BorderRadius.md,
                  backgroundColor: '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: colors.glassBorder,
                  overflow: 'hidden',
                }}
              >
                  <MoneyKaiBrandMark size={42} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={{ fontSize: Typography.fontSize.lg, lineHeight: 24, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}
                    numberOfLines={1}
                  >
                    MoneyKai
                  </Text>
                  {activeMeta.subtitle ? (
                    <Text
                      style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}
                      numberOfLines={1}
                    >
                      {activeMeta.title}
                    </Text>
                  ) : null}
                </View>
              </Pressable>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel="Open AI Review"
                  onPress={() => router.push('/ai-review' as any)}
                  style={({ hovered, pressed }: any) => ({
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: hovered ? withAlpha(colors.primary, 0.2) : colors.primaryBg,
                    borderWidth: 1,
                    borderColor: withAlpha(colors.primary, 0.24),
                    transform: hovered && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
                  })}
                >
                  <MaterialCommunityIcons name="brain" size={20} color={colors.primary} />
                </Pressable>
                <AccountMenu
                  compact
                  placement="below"
                  user={user}
                  onProfile={() => router.push('/profile-edit' as any)}
                  onSettings={() => router.push('/settings' as any)}
                  onSignOut={handleSignOut}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Open notifications"
                  onPress={() => router.push('/notifications' as any)}
                  style={({ hovered, pressed }: any) => ({
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: hovered ? colors.surfaceElevated : 'transparent',
                    borderWidth: 0,
                    transform: hovered && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
                  })}
                >
                  <MaterialCommunityIcons name="bell-outline" size={20} color={colors.textPrimary} />
                </Pressable>

                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel="Open help and frequently asked questions"
                  onPress={() => router.push('/faq' as any)}
                  style={({ hovered, pressed }: any) => ({
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: hovered ? colors.surfaceElevated : 'transparent',
                    borderWidth: 0,
                    transform: hovered && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
                  })}
                >
                  <MaterialCommunityIcons name="help-circle-outline" size={20} color={colors.textPrimary} />
                </Pressable>
              </View>
            </View>

            {pathname !== '/dashboard' && pathname !== '/budgets' ? <ReportingMonthPicker compact /> : null}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: Spacing.base }}
            >
              <SlidingNavItems pathname={pathname} orientation="horizontal" />
            </ScrollView>
          </View>

          <View
            style={{
              flex: 1,
              minWidth: 0,
              paddingHorizontal: Spacing.base,
              paddingTop: Spacing.base,
              paddingBottom: insets.bottom + Spacing.lg,
            }}
          >
            <View
              nativeID="main-content"
              role="main"
              style={{ flex: 1, minWidth: 0, width: '100%', maxWidth: 720, alignSelf: 'center' }}
            >
              {children}
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, backgroundColor: colors.background, flexDirection: 'row', overflow: 'hidden' }}>
        <View
          pointerEvents="none"
          style={{
            display: 'none',
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: sidebarWidth + Spacing.base,
            width: 1,
            backgroundColor: withAlpha(colors.primaryLight, 0.08),
          }}
        />
        <View
          pointerEvents="none"
          style={{
            display: 'none',
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: Spacing.base,
            width: 1,
            backgroundColor: withAlpha(colors.primaryLight, 0.06),
          }}
        />
        <View
          style={{
            width: sidebarWidth,
            margin: 10,
            marginRight: 0,
            borderWidth: 1,
            borderColor: colors.glassBorder,
            borderRadius: 24,
            backgroundColor: withAlpha(colors.surface, 0.58),
            height: sidebarHeight,
            maxHeight: sidebarHeight,
            paddingVertical: 18,
            paddingHorizontal: 16,
            overflow: 'hidden',
            ...Shadows.sm,
            shadowColor: colors.shadowColor,
          }}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: insets.bottom + 160, flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          >
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Go to MoneyKai dashboard"
              onPress={() => router.push('/dashboard' as any)}
              style={({ hovered, pressed }: any) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                marginBottom: Spacing.lg,
                padding: 6,
                marginHorizontal: -6,
                borderRadius: BorderRadius.lg,
                backgroundColor: hovered ? `${colors.primary}0D` : 'transparent',
                transform: hovered && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
              })}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: BorderRadius.lg,
                  backgroundColor: '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: colors.glassBorder,
                  overflow: 'hidden',
                  ...Shadows.md,
                  shadowColor: colors.shadowColor,
                }}
              >
                <MoneyKaiBrandMark size={48} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                  MoneyKai
                </Text>
                <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
                  Desktop money workspace
                </Text>
              </View>
            </Pressable>

            <SlidingNavItems pathname={pathname} orientation="vertical" />

            <View
              style={{
                position: 'absolute',
                left: 12,
                right: 12,
                bottom: 12,
                backgroundColor: colors.glassBg,
                borderRadius: BorderRadius.md,
                borderWidth: 1,
                borderColor: colors.glassBorder,
                ...Shadows.sm,
                shadowColor: colors.shadowColor,
                ...(glassBackdropStyle ?? {}),
              }}
            >
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Open AI Review"
                onPress={() => router.push('/ai-review' as any)}
                style={({ hovered, pressed }: any) => ({
                  minHeight: 60,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: Spacing.sm,
                  paddingHorizontal: Spacing.md,
                  paddingVertical: Spacing.sm,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.glassBorder,
                  backgroundColor: hovered ? withAlpha(colors.primary, 0.16) : colors.primaryBg,
                  transform: hovered && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
                })}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: BorderRadius.sm,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: withAlpha(colors.primary, 0.16),
                  }}
                >
                  <MaterialCommunityIcons name="brain" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                    AI Review
                  </Text>
                  <Text numberOfLines={1} style={{ marginTop: 1, fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
                    Review receipt drafts before saving
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={18} color={colors.primary} />
              </Pressable>
              <AccountMenu
                placement="above"
                user={user}
                onProfile={() => router.push('/profile-edit' as any)}
                onSettings={() => router.push('/settings' as any)}
                onSignOut={handleSignOut}
              />

              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Open MoneyKai Plus premium membership"
                onPress={() => router.push('/subscriptions' as any)}
                style={({ hovered, pressed }: any) => ({
                  display: 'none',
                  minHeight: 40,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: Spacing.sm,
                  marginTop: Spacing.md,
                  paddingHorizontal: Spacing.md,
                  borderRadius: BorderRadius.md,
                  backgroundColor: hovered ? withAlpha(colors.warning, 0.24) : withAlpha(colors.warning, 0.14),
                  borderWidth: 1,
                  borderColor: hovered ? withAlpha(colors.warning, 0.62) : withAlpha(colors.warning, 0.42),
                  transform: hovered && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
                })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <MaterialCommunityIcons name="crown-outline" size={17} color={colors.warning} />
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: Typography.fontSize.sm,
                      lineHeight: 20,
                      fontFamily: Typography.fontFamily.bold,
                      color: colors.warning,
                    }}
                  >
                    MoneyKai+
                  </Text>
                </View>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: Typography.fontSize.xs,
                    lineHeight: 16,
                    fontFamily: Typography.fontFamily.medium,
                    color: colors.warning,
                  }}
                >
                  Premium
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Download MoneyKai mobile app APK"
                accessibilityHint="The Android APK download is currently under development"
                onPress={handleDownloadMobileApp}
                style={({ hovered, pressed }: any) => ({
                  display: 'none',
                  minHeight: 54,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: Spacing.sm,
                  marginTop: Spacing.sm,
                  paddingHorizontal: Spacing.md,
                  paddingVertical: 9,
                  borderRadius: BorderRadius.md,
                  backgroundColor: hovered ? withAlpha(colors.primary, 0.18) : withAlpha(colors.primary, 0.1),
                  borderWidth: 1,
                  borderColor: hovered ? withAlpha(colors.primary, 0.42) : withAlpha(colors.primary, 0.24),
                  transform: hovered && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
                })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1, minWidth: 0 }}>
                  <MaterialCommunityIcons name="cellphone" size={18} color={colors.primary} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: Typography.fontSize.xs,
                        lineHeight: 18,
                        fontFamily: Typography.fontFamily.semiBold,
                        color: colors.textPrimary,
                      }}
                    >
                      Mobile app
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 11,
                        lineHeight: 15,
                        color: colors.textSecondary,
                      }}
                    >
                      Download APK
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    borderRadius: BorderRadius.full,
                    backgroundColor: withAlpha(colors.primary, 0.14),
                    borderWidth: 1,
                    borderColor: withAlpha(colors.primary, 0.28),
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 10,
                      lineHeight: 13,
                      fontFamily: Typography.fontFamily.semiBold,
                      color: colors.primary,
                    }}
                  >
                    Soon
                  </Text>
                </View>
              </Pressable>

              <View style={{ display: 'none', flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Open settings"
                  onPress={() => router.push('/settings' as any)}
                  style={({ hovered, pressed }: any) => ({
                    flex: 1,
                    minHeight: 38,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 7,
                    paddingHorizontal: Spacing.sm,
                    borderRadius: BorderRadius.md,
                    backgroundColor: hovered ? `${colors.primary}14` : 'rgba(255, 255, 255, 0.04)',
                    borderWidth: 1,
                    borderColor: hovered ? `${colors.primary}36` : colors.glassBorder,
                    transform: hovered && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
                  })}
                >
                  <MaterialCommunityIcons name="cog-outline" size={16} color={colors.primary} />
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: Typography.fontSize.xs,
                      lineHeight: 18,
                      fontFamily: Typography.fontFamily.semiBold,
                      color: colors.textPrimary,
                    }}
                  >
                    Settings
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Sign out"
                  onPress={handleSignOut}
                  style={({ hovered, pressed }: any) => ({
                    flex: 1,
                    minHeight: 38,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 7,
                    paddingHorizontal: Spacing.sm,
                    borderRadius: BorderRadius.md,
                    backgroundColor: hovered ? `${colors.error}12` : 'rgba(255, 255, 255, 0.04)',
                    borderWidth: 1,
                    borderColor: hovered ? `${colors.error}34` : colors.glassBorder,
                    transform: hovered && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
                  })}
                >
                  <MaterialCommunityIcons name="logout" size={16} color={colors.textSecondary} />
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: Typography.fontSize.xs,
                      lineHeight: 18,
                      fontFamily: Typography.fontFamily.semiBold,
                      color: colors.textSecondary,
                    }}
                  >
                    Sign out
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>

        <View style={{ flex: 1, minWidth: 0, position: 'relative' }}>
          {pathname !== '/dashboard' && pathname !== '/budgets' && pathname !== '/portfolio' ? <View
            style={{
              marginTop: Spacing.base,
              marginRight: Spacing.base,
              marginLeft: Spacing.base,
              borderBottomWidth: 1,
              borderBottomColor: colors.borderLight,
              backgroundColor: 'transparent',
              position: 'relative',
              zIndex: 40,
              overflow: 'visible',
              paddingHorizontal: Spacing['2xl'],
              paddingVertical: Spacing.base,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: Spacing.lg,
            }}
          >
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minWidth: 0 }}>
              {activeMeta.icon ? (
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: BorderRadius.lg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.surfaceElevated,
                    borderWidth: 1,
                    borderColor: colors.borderLight,
                  }}
                >
                  <MaterialCommunityIcons name={activeMeta.icon} size={27} color={colors.textPrimary} />
                </View>
              ) : null}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }} numberOfLines={1}>
                  {activeMeta.title}
                </Text>
                {activeMeta.subtitle ? (
                  <Text style={{ marginTop: 4, fontSize: Typography.fontSize.sm, color: colors.textSecondary }} numberOfLines={1}>
                    {activeMeta.subtitle}
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, position: 'relative', zIndex: 60, overflow: 'visible' }}>
              {pathname !== '/dashboard' ? <ReportingMonthPicker /> : null}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open notifications"
                onPress={() => router.push('/notifications' as any)}
                style={({ hovered, pressed }: any) => ({
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: hovered ? colors.surfaceElevated : 'transparent',
                  borderWidth: 0,
                  transform: hovered && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
                })}
              >
                <MaterialCommunityIcons name="bell-outline" size={20} color={colors.textPrimary} />
              </Pressable>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Open help and frequently asked questions"
                onPress={() => router.push('/faq' as any)}
                style={({ hovered, pressed }: any) => ({
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: hovered ? colors.surfaceElevated : 'transparent',
                  borderWidth: 0,
                  transform: hovered && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
                })}
              >
                <MaterialCommunityIcons name="help-circle-outline" size={20} color={colors.textPrimary} />
              </Pressable>

            </View>
          </View> : null}

          <View
            style={{
              flex: 1,
              minWidth: 0,
              position: 'relative',
              zIndex: 1,
              paddingHorizontal: 24,
              paddingTop: pathname === '/dashboard' || pathname === '/budgets' ? 18 : 16,
              paddingBottom: insets.bottom + 20,
            }}
          >
            <View
              nativeID="main-content"
              role="main"
              style={{ maxWidth: 1460, width: '100%', alignSelf: 'center', flex: 1, minWidth: 0 }}
            >
              {children}
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default DesktopShell;
