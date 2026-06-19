import React, { type PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, usePathname } from 'expo-router';
import { Pressable, ScrollView, Text, View, type StyleProp, type ViewStyle, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/theme';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Button } from '@/components/ui/Button';
import { endOfMonth, formatDate, startOfMonth } from '@/utils/dateUtils';
import { glassBackdropStyle } from '@/utils/glassStyle';

type NavItem = {
  href: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'view-dashboard-outline' },
  { href: '/transactions', label: 'Transactions', icon: 'swap-horizontal' },
  { href: '/ai-review', label: 'AI Review', icon: 'receipt-text-outline' },
  { href: '/budgets', label: 'Budgets', icon: 'wallet-outline' },
  { href: '/goals', label: 'Goals', icon: 'target' },
  { href: '/wealth', label: 'Wealth', icon: 'chart-timeline-variant' },
  { href: '/portfolio', label: 'Portfolio', icon: 'briefcase-outline' },
  { href: '/reports', label: 'Reports', icon: 'chart-bar' },
  { href: '/accounts', label: 'Accounts', icon: 'credit-card-outline' },
] as const;

const ROUTE_META: { href: string; title: string; subtitle: string }[] = [
  { href: '/dashboard', title: 'Dashboard', subtitle: 'A clear overview of your money' },
  { href: '/transactions', title: 'Transactions', subtitle: 'Track income, expenses, and history' },
  { href: '/ai-review', title: 'AI Review', subtitle: 'Review receipt and image analysis before using it' },
  { href: '/budgets', title: 'Budgets', subtitle: 'Review monthly limits and budget health' },
  { href: '/goals', title: 'Goals', subtitle: 'Stay focused on savings progress' },
  { href: '/wealth', title: 'Wealth', subtitle: 'Net worth, allocation, and AI portfolio review' },
  { href: '/portfolio', title: 'Portfolio', subtitle: 'Manual holdings and provider placeholders' },
  { href: '/reports', title: 'Reports', subtitle: 'Spot patterns in your spending' },
  { href: '/accounts', title: 'Accounts', subtitle: 'Linked balances, sync health, and account controls' },
  { href: '/categories', title: 'Categories', subtitle: 'See where money goes by category' },
  { href: '/subscriptions', title: 'Subscriptions', subtitle: 'Choose the MoneyKai plan that fits your workspace' },
  { href: '/settings', title: 'Settings', subtitle: 'Profile, privacy, and backups' },
];

function MoneyKaiBrandMark({ size }: { size: number }) {
  return (
    <Image
      source={{ uri: '/brand/moneykai-mark.jpeg' }}
      contentFit="contain"
      accessibilityIgnoresInvertColors
      style={{ width: Math.round(size * 0.78), height: Math.round(size * 0.78) }}
    />
  );
}

const normalizePath = (pathname: string) => pathname.replace('/(tabs)', '') || '/';

const isRouteActive = (pathname: string, href: string) => {
  const normalized = normalizePath(pathname);
  if (href === '/dashboard') return normalized === '/dashboard';
  return normalized === href || normalized.startsWith(`${href}/`);
};

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => ({
  index,
  label: formatDate(new Date(2026, index, 1), 'MMM'),
  fullLabel: formatDate(new Date(2026, index, 1), 'MMMM'),
}));

const toMonthKey = (year: number, monthIndex: number) => `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

const getCurrentMonthKey = () => formatDate(new Date(), 'yyyy-MM');

const parseMonthKey = (monthKey: string) => {
  const [yearValue, monthValue] = monthKey.split('-').map((part) => Number(part));
  const safeYear = Number.isFinite(yearValue) && yearValue > 1900 ? yearValue : new Date().getFullYear();
  const safeMonthIndex = Number.isFinite(monthValue) ? Math.min(Math.max(monthValue - 1, 0), 11) : new Date().getMonth();
  return new Date(safeYear, safeMonthIndex, 1);
};

export function DesktopShell({ children }: PropsWithChildren) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const setTransactionFilter = useTransactionStore((s) => s.setFilter);
  const currentMonthKey = useMemo(() => getCurrentMonthKey(), []);
  const [selectedMonthKey, setSelectedMonthKey] = useState(currentMonthKey);
  const [showMonthMenu, setShowMonthMenu] = useState(false);
  const [visibleYear, setVisibleYear] = useState(() => parseMonthKey(currentMonthKey).getFullYear());

  const sidebarWidth = width >= 1440 ? 300 : 268;
  const activeMeta = ROUTE_META.find((item) => isRouteActive(pathname, item.href)) ?? ROUTE_META[0];
  const selectedMonthDate = useMemo(() => parseMonthKey(selectedMonthKey), [selectedMonthKey]);
  const monthRangeLabel = `${formatDate(startOfMonth(selectedMonthDate), 'MMM d')} - ${formatDate(endOfMonth(selectedMonthDate), 'MMM d, yyyy')}`;
  const isCompact = width < 900;

  useEffect(() => {
    if (showMonthMenu) {
      setVisibleYear(selectedMonthDate.getFullYear());
    }
  }, [selectedMonthDate, showMonthMenu]);

  useEffect(() => {
    setTransactionFilter({
      dateRange: 'custom',
      startDate: formatDate(startOfMonth(selectedMonthDate), 'yyyy-MM-dd'),
      endDate: formatDate(endOfMonth(selectedMonthDate), 'yyyy-MM-dd'),
    });
  }, [selectedMonthDate, setTransactionFilter]);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  const handleSelectMonth = (monthKey: string) => {
    setSelectedMonthKey(monthKey);
    setShowMonthMenu(false);
  };

  const handleResetToCurrentMonth = () => {
    setSelectedMonthKey(currentMonthKey);
    setVisibleYear(parseMonthKey(currentMonthKey).getFullYear());
    setShowMonthMenu(false);
  };

  if (isCompact) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          {showMonthMenu ? (
            <Pressable
              onPress={() => setShowMonthMenu(false)}
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                zIndex: 30,
              }}
            />
          ) : null}

          <View
            style={{
              borderBottomWidth: 1,
              borderBottomColor: colors.glassBorder,
              backgroundColor: colors.glassBg,
              paddingHorizontal: Spacing.base,
              paddingTop: Spacing.sm,
              paddingBottom: Spacing.md,
              gap: Spacing.md,
              position: 'relative',
              zIndex: 40,
              ...Shadows.md,
              shadowColor: colors.shadowColor,
              ...(glassBackdropStyle ?? {}),
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
                    backgroundColor: colors.primaryBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: colors.borderLight,
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
                  <Text
                    style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}
                    numberOfLines={1}
                  >
                    {activeMeta.title}
                  </Text>
                </View>
              </Pressable>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
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
                    backgroundColor: hovered ? colors.surfaceElevated : colors.glassBg,
                    borderWidth: 1,
                    borderColor: hovered ? `${colors.primary}40` : colors.glassBorder,
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
                    backgroundColor: hovered ? colors.surfaceElevated : colors.glassBg,
                    borderWidth: 1,
                    borderColor: hovered ? `${colors.primary}40` : colors.glassBorder,
                    transform: hovered && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
                  })}
                >
                  <MaterialCommunityIcons name="help-circle-outline" size={20} color={colors.textPrimary} />
                </Pressable>
              </View>
            </View>

            <View style={{ position: 'relative', zIndex: 60 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Choose reporting month"
                accessibilityState={{ expanded: showMonthMenu }}
                onPress={() => setShowMonthMenu((current) => !current)}
                style={({ hovered, pressed }: any) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: Spacing.sm,
                  backgroundColor: hovered ? colors.surfaceElevated : colors.glassBg,
                  borderWidth: 1,
                  borderColor: hovered ? `${colors.primary}38` : colors.glassBorder,
                  borderRadius: BorderRadius.md,
                  paddingHorizontal: Spacing.md,
                  paddingVertical: 11,
                  transform: hovered && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
                })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1, minWidth: 0 }}>
                  <MaterialCommunityIcons name="calendar-month-outline" size={18} color={colors.textPrimary} />
                  <Text
                    style={{ flex: 1, fontSize: Typography.fontSize.sm, lineHeight: 20, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary }}
                    numberOfLines={1}
                  >
                    {monthRangeLabel}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-down" size={16} color={colors.textSecondary} />
              </Pressable>

              {showMonthMenu && (
                <MonthYearPickerPopover
                  selectedMonthKey={selectedMonthKey}
                  currentMonthKey={currentMonthKey}
                  visibleYear={visibleYear}
                  onChangeYear={setVisibleYear}
                  onSelect={handleSelectMonth}
                  onResetToCurrentMonth={handleResetToCurrentMonth}
                  onClose={() => setShowMonthMenu(false)}
                  style={{ top: 52, left: 0, right: 0 }}
                />
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: Spacing.xs, paddingRight: Spacing.base }}
            >
              {NAV_ITEMS.map((item) => {
                const active = isRouteActive(pathname, item.href);
                return (
                  <Pressable
                    key={`${item.href}-${item.label}`}
                    accessibilityRole="link"
                    accessibilityLabel={`Open ${item.label}`}
                    accessibilityState={{ selected: active }}
                    onPress={() => router.push(item.href as any)}
                    style={({ hovered, pressed }: any) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      paddingHorizontal: Spacing.md,
                      paddingVertical: 10,
                      borderRadius: BorderRadius.full,
                      backgroundColor: active ? colors.primaryBg : hovered ? `${colors.primary}12` : colors.glassBg,
                      borderWidth: 1,
                      borderColor: active ? `${colors.primary}45` : hovered ? `${colors.primary}24` : colors.glassBorder,
                      transform: hovered && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
                    })}
                  >
                    <MaterialCommunityIcons
                      name={item.icon}
                      size={18}
                      color={active ? colors.primary : colors.textSecondary}
                    />
                    <Text
                      style={{
                        fontSize: Typography.fontSize.sm,
                        lineHeight: 20,
                        fontFamily: Typography.fontFamily.medium,
                        color: active ? colors.textPrimary : colors.textSecondary,
                      }}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
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
      <View style={{ flex: 1, backgroundColor: colors.background, flexDirection: 'row' }}>
        <View
          style={{
            width: sidebarWidth,
            margin: Spacing.base,
            marginRight: 0,
            borderWidth: 1,
            borderColor: colors.glassBorder,
            borderRadius: BorderRadius['2xl'],
            backgroundColor: colors.glassBg,
            paddingVertical: Spacing.base,
            paddingHorizontal: Spacing.base,
            overflow: 'hidden',
            ...Shadows.lg,
            shadowColor: colors.shadowColor,
            ...(glassBackdropStyle ?? {}),
          }}
        >
          <View style={{ flex: 1, paddingBottom: insets.bottom + 20 }}>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Go to MoneyKai dashboard"
              onPress={() => router.push('/dashboard' as any)}
              style={({ hovered, pressed }: any) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                marginBottom: Spacing['2xl'],
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
                  backgroundColor: colors.primaryBg,
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

            <View style={{ gap: 6, marginBottom: Spacing['2xl'] }}>
              {NAV_ITEMS.map((item) => {
                const active = isRouteActive(pathname, item.href);
                return (
                  <Pressable
                    key={`${item.href}-${item.label}`}
                    accessibilityRole="link"
                    accessibilityLabel={`Open ${item.label}`}
                    accessibilityState={{ selected: active }}
                    onPress={() => router.push(item.href as any)}
                    style={({ hovered, pressed }: any) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      borderRadius: BorderRadius.md,
                      backgroundColor: active ? (hovered ? `${colors.primary}28` : colors.primaryBg) : hovered ? `${colors.primary}12` : 'transparent',
                      borderWidth: 1,
                      borderColor: active ? `${colors.primary}35` : hovered ? `${colors.primary}24` : 'transparent',
                      transform: hovered && !pressed ? [{ translateX: 2 }] : [{ translateX: 0 }],
                    })}
                  >
                    <MaterialCommunityIcons
                      name={item.icon}
                      size={20}
                      color={active ? colors.primary : colors.textSecondary}
                    />
                    <Text
                      style={{
                        fontSize: Typography.fontSize.sm,
                        fontFamily: Typography.fontFamily.medium,
                        color: active ? colors.textPrimary : colors.textSecondary,
                      }}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View
              style={{
                backgroundColor: colors.glassBg,
                borderRadius: BorderRadius.lg,
                padding: Spacing.md,
                borderWidth: 1,
                borderColor: colors.glassBorder,
                ...Shadows.md,
                shadowColor: colors.shadowColor,
                ...(glassBackdropStyle ?? {}),
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <UserAvatar
                  name={user?.full_name}
                  email={user?.email}
                  avatarUrl={user?.avatar_url}
                  size={42}
                />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={{
                      fontSize: Typography.fontSize.sm,
                      lineHeight: 20,
                      fontFamily: Typography.fontFamily.semiBold,
                      color: colors.textPrimary,
                    }}
                    numberOfLines={1}
                  >
                    {user?.full_name || 'Signed in user'}
                  </Text>
                  <Text
                    style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}
                    numberOfLines={1}
                  >
                    {user?.email || 'No email available'}
                  </Text>
                </View>
              </View>

              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Open MoneyKai Plus premium membership"
                onPress={() => router.push('/subscriptions' as any)}
                style={({ hovered, pressed }: any) => ({
                  minHeight: 40,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: Spacing.sm,
                  marginTop: Spacing.md,
                  paddingHorizontal: Spacing.md,
                  borderRadius: BorderRadius.md,
                  backgroundColor: hovered ? 'rgba(245, 197, 90, 0.22)' : 'rgba(245, 197, 90, 0.14)',
                  borderWidth: 1,
                  borderColor: hovered ? 'rgba(245, 197, 90, 0.62)' : 'rgba(245, 197, 90, 0.42)',
                  transform: hovered && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
                })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <MaterialCommunityIcons name="crown-outline" size={17} color="#F5C55A" />
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: Typography.fontSize.sm,
                      lineHeight: 20,
                      fontFamily: Typography.fontFamily.bold,
                      color: '#F5C55A',
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
                    color: '#FFE6A6',
                  }}
                >
                  Premium
                </Text>
              </Pressable>

              <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md }}>
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
          </View>
        </View>

        <View style={{ flex: 1, minWidth: 0, position: 'relative' }}>
          {showMonthMenu ? (
            <Pressable
              onPress={() => setShowMonthMenu(false)}
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                zIndex: 30,
              }}
            />
          ) : null}

          <View
            style={{
              marginTop: Spacing.base,
              marginRight: Spacing.base,
              marginLeft: Spacing.base,
              borderWidth: 1,
              borderColor: colors.glassBorder,
              borderRadius: BorderRadius['2xl'],
              backgroundColor: colors.glassBg,
              position: 'relative',
              zIndex: 40,
              overflow: 'visible',
              paddingHorizontal: Spacing['2xl'],
              paddingVertical: Spacing.base,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: Spacing.lg,
              ...Shadows.sm,
              shadowColor: colors.shadowColor,
              ...(glassBackdropStyle ?? {}),
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
                {activeMeta.title}
              </Text>
              <Text style={{ marginTop: 4, fontSize: Typography.fontSize.sm, color: colors.textSecondary }}>
                {activeMeta.subtitle}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, position: 'relative', zIndex: 60, overflow: 'visible' }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Choose reporting month"
                accessibilityState={{ expanded: showMonthMenu }}
                onPress={() => setShowMonthMenu((current) => !current)}
                style={({ hovered, pressed }: any) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: hovered ? colors.surfaceElevated : colors.glassBg,
                  borderWidth: 1,
                  borderColor: hovered ? `${colors.primary}38` : colors.glassBorder,
                  borderRadius: BorderRadius.md,
                  paddingHorizontal: Spacing.md,
                  paddingVertical: 10,
                  transform: hovered && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
                })}
              >
                <MaterialCommunityIcons name="calendar-month-outline" size={18} color={colors.textPrimary} />
                <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary }}>
                  {monthRangeLabel}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={16} color={colors.textSecondary} />
              </Pressable>

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
                  backgroundColor: hovered ? colors.surfaceElevated : colors.glassBg,
                  borderWidth: 1,
                  borderColor: hovered ? `${colors.primary}40` : colors.glassBorder,
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
                  backgroundColor: hovered ? colors.surfaceElevated : colors.glassBg,
                  borderWidth: 1,
                  borderColor: hovered ? `${colors.primary}40` : colors.glassBorder,
                  transform: hovered && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
                })}
              >
                <MaterialCommunityIcons name="help-circle-outline" size={20} color={colors.textPrimary} />
              </Pressable>

              {showMonthMenu && (
                <MonthYearPickerPopover
                  selectedMonthKey={selectedMonthKey}
                  currentMonthKey={currentMonthKey}
                  visibleYear={visibleYear}
                  onChangeYear={setVisibleYear}
                  onSelect={handleSelectMonth}
                  onResetToCurrentMonth={handleResetToCurrentMonth}
                  onClose={() => setShowMonthMenu(false)}
                  style={{ top: 54, right: 108, width: 340 }}
                />
              )}
            </View>
          </View>

          <View
            style={{
              flex: 1,
              minWidth: 0,
              position: 'relative',
              zIndex: 1,
              paddingHorizontal: Spacing['2xl'],
              paddingTop: Spacing.xl,
              paddingBottom: insets.bottom + Spacing['2xl'],
            }}
          >
            <View
              nativeID="main-content"
              role="main"
              style={{ maxWidth: 1440, width: '100%', alignSelf: 'center', flex: 1, minWidth: 0 }}
            >
              {children}
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

type MonthYearPickerPopoverProps = {
  selectedMonthKey: string;
  currentMonthKey: string;
  visibleYear: number;
  onChangeYear: (year: number) => void;
  onSelect: (monthKey: string) => void;
  onResetToCurrentMonth: () => void;
  onClose: () => void;
  style?: StyleProp<ViewStyle>;
};

function MonthYearPickerPopover({
  selectedMonthKey,
  currentMonthKey,
  visibleYear,
  onChangeYear,
  onSelect,
  onResetToCurrentMonth,
  onClose,
  style,
}: MonthYearPickerPopoverProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        {
          position: 'absolute',
          backgroundColor: colors.glassBg,
          borderRadius: BorderRadius.lg,
          borderWidth: 1,
          borderColor: colors.glassBorder,
          ...Shadows.lg,
          shadowColor: colors.shadowColor,
          padding: Spacing.md,
          zIndex: 20,
          gap: Spacing.md,
          overflow: 'hidden',
          ...(glassBackdropStyle ?? {}),
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous year"
          onPress={() => onChangeYear(visibleYear - 1)}
          style={({ hovered, pressed }: any) => ({
            width: 38,
            height: 38,
            borderRadius: BorderRadius.md,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: hovered ? colors.surfaceElevated : colors.glassBg,
            borderWidth: 1,
            borderColor: hovered ? `${colors.primary}40` : colors.glassBorder,
            transform: hovered && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
          })}
        >
          <MaterialCommunityIcons name="chevron-left" size={22} color={colors.textPrimary} />
        </Pressable>

        <View style={{ flex: 1, alignItems: 'center', minWidth: 0 }}>
          <Text style={{ fontSize: Typography.fontSize.lg, lineHeight: 24, fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
            {visibleYear}
          </Text>
          <Text style={{ marginTop: 2, fontSize: Typography.fontSize.xs, lineHeight: 16, color: colors.textSecondary }}>
            Select reporting month
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next year"
          onPress={() => onChangeYear(visibleYear + 1)}
          style={({ hovered, pressed }: any) => ({
            width: 38,
            height: 38,
            borderRadius: BorderRadius.md,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: hovered ? colors.surfaceElevated : colors.glassBg,
            borderWidth: 1,
            borderColor: hovered ? `${colors.primary}40` : colors.glassBorder,
            transform: hovered && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
          })}
        >
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
        {MONTH_OPTIONS.map((month) => {
          const monthKey = toMonthKey(visibleYear, month.index);
          const active = monthKey === selectedMonthKey;
          const isCurrent = monthKey === currentMonthKey;

          return (
            <Pressable
              key={monthKey}
              accessibilityRole="button"
              accessibilityLabel={`Show ${month.fullLabel} ${visibleYear}`}
              accessibilityState={{ selected: active }}
              onPress={() => onSelect(monthKey)}
              style={({ hovered, pressed }: any) => ({
                width: '31.4%',
                minHeight: 58,
                borderRadius: BorderRadius.md,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                backgroundColor: active ? colors.primary : hovered ? `${colors.primary}10` : colors.glassBg,
                borderWidth: 1,
                borderColor: active ? colors.primary : isCurrent ? colors.primaryLight : colors.glassBorder,
                transform: hovered && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
              })}
            >
              <Text
                style={{
                  fontSize: Typography.fontSize.sm,
                  lineHeight: 20,
                  fontFamily: Typography.fontFamily.semiBold,
                  color: active ? colors.textInverse : colors.textPrimary,
                }}
              >
                {month.label}
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: Typography.fontSize.xs,
                  lineHeight: 16,
                  color: active ? colors.textInverse : isCurrent ? colors.primary : colors.textTertiary,
                }}
              >
                {isCurrent ? 'Current' : month.fullLabel}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        <Button
          title="Current Month"
          icon="calendar-today-outline"
          variant="outline"
          size="sm"
          onPress={onResetToCurrentMonth}
          style={{ flex: 1 }}
        />
        <Button
          title="Done"
          icon="check"
          size="sm"
          onPress={onClose}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

export default DesktopShell;
