import React, { type PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/theme';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Button } from '@/components/ui/Button';
import { endOfMonth, formatDate, getLastSixMonths, startOfMonth } from '@/utils/dateUtils';

type NavItem = {
  href: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: 'view-dashboard-outline' },
  { href: '/transactions', label: 'Transactions', icon: 'swap-horizontal' },
  { href: '/ai-review', label: 'AI Review', icon: 'receipt-text-outline' },
  { href: '/budgets', label: 'Budgets', icon: 'wallet-outline' },
  { href: '/goals', label: 'Goals', icon: 'target' },
  { href: '/wealth', label: 'Wealth', icon: 'chart-timeline-variant' },
  { href: '/portfolio', label: 'Portfolio', icon: 'briefcase-outline' },
  { href: '/reports', label: 'Reports', icon: 'chart-bar' },
  { href: '/accounts', label: 'Accounts', icon: 'credit-card-outline' },
  { href: '/settings', label: 'Settings', icon: 'cog-outline' },
] as const;

const ROUTE_META: { href: string; title: string; subtitle: string }[] = [
  { href: '/', title: 'Dashboard', subtitle: 'A clear overview of your money' },
  { href: '/transactions', title: 'Transactions', subtitle: 'Track income, expenses, and history' },
  { href: '/ai-review', title: 'AI Review', subtitle: 'Review receipt and image analysis before using it' },
  { href: '/budgets', title: 'Budgets', subtitle: 'Review monthly limits and budget health' },
  { href: '/goals', title: 'Goals', subtitle: 'Stay focused on savings progress' },
  { href: '/wealth', title: 'Wealth', subtitle: 'Net worth, allocation, and AI portfolio review' },
  { href: '/portfolio', title: 'Portfolio', subtitle: 'Manual holdings and provider placeholders' },
  { href: '/reports', title: 'Reports', subtitle: 'Spot patterns in your spending' },
  { href: '/accounts', title: 'Accounts', subtitle: 'Profile and account-related preferences' },
  { href: '/categories', title: 'Categories', subtitle: 'See where money goes by category' },
  { href: '/settings', title: 'Settings', subtitle: 'Profile, privacy, and backups' },
];

const normalizePath = (pathname: string) => pathname.replace('/(tabs)', '') || '/';

const isRouteActive = (pathname: string, href: string) => {
  const normalized = normalizePath(pathname);
  if (href === '/') return normalized === '/';
  return normalized === href || normalized.startsWith(`${href}/`);
};

export function DesktopShell({ children }: PropsWithChildren) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const setTransactionFilter = useTransactionStore((s) => s.setFilter);
  const months = useMemo(() => getLastSixMonths(), []);
  const [selectedMonthKey, setSelectedMonthKey] = useState(months[months.length - 1]?.key ?? '');
  const [showMonthMenu, setShowMonthMenu] = useState(false);

  const sidebarWidth = width >= 1440 ? 300 : 268;
  const activeMeta = ROUTE_META.find((item) => isRouteActive(pathname, item.href)) ?? ROUTE_META[0];
  const selectedMonthDate = useMemo(
    () => months.find((month) => month.key === selectedMonthKey)?.date ?? months[months.length - 1]?.date ?? new Date(),
    [months, selectedMonthKey]
  );
  const monthRangeLabel = `${formatDate(startOfMonth(selectedMonthDate), 'MMM d')} - ${formatDate(endOfMonth(selectedMonthDate), 'MMM d, yyyy')}`;
  const isCompact = width < 900;

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
                onPress={() => router.push('/')}
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
                  }}
                >
                  <MaterialCommunityIcons name="wallet-outline" size={22} color={colors.primary} />
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
                    backgroundColor: hovered ? colors.surfaceElevated : colors.card,
                    borderWidth: 1,
                    borderColor: hovered ? `${colors.primary}40` : colors.borderLight,
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
                    backgroundColor: hovered ? colors.surfaceElevated : colors.card,
                    borderWidth: 1,
                    borderColor: hovered ? `${colors.primary}40` : colors.borderLight,
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
                  backgroundColor: hovered ? colors.surfaceElevated : colors.card,
                  borderWidth: 1,
                  borderColor: hovered ? `${colors.primary}38` : colors.borderLight,
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
                <View
                  style={{
                    position: 'absolute',
                    top: 52,
                    left: 0,
                    right: 0,
                    backgroundColor: colors.surface,
                    borderRadius: BorderRadius.lg,
                    borderWidth: 1,
                    borderColor: colors.borderLight,
                    ...Shadows.lg,
                    shadowColor: colors.shadowColor,
                    padding: Spacing.sm,
                    zIndex: 20,
                  }}
                >
                  {months.map((month) => {
                    const active = month.key === selectedMonthKey;
                    return (
                      <Pressable
                        key={month.key}
                        accessibilityRole="button"
                        accessibilityLabel={`Show ${month.label}`}
                        accessibilityState={{ selected: active }}
                        onPress={() => {
                          setSelectedMonthKey(month.key);
                          setShowMonthMenu(false);
                        }}
                        style={({ hovered }: any) => ({
                          paddingHorizontal: Spacing.md,
                          paddingVertical: 11,
                          borderRadius: BorderRadius.md,
                          backgroundColor: active ? colors.primaryBg : hovered ? `${colors.primary}10` : 'transparent',
                        })}
                      >
                        <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 20, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>
                          {month.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
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
                      backgroundColor: active ? colors.primaryBg : hovered ? `${colors.primary}12` : colors.card,
                      borderWidth: 1,
                      borderColor: active ? `${colors.primary}45` : hovered ? `${colors.primary}24` : colors.borderLight,
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
              accessibilityRole="main"
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
            borderRightWidth: 1,
            borderRightColor: colors.borderLight,
            backgroundColor: colors.surface,
            paddingVertical: Spacing.base,
            paddingHorizontal: Spacing.base,
          }}
        >
          <View style={{ flex: 1, paddingBottom: insets.bottom + 20 }}>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Go to MoneyKai dashboard"
              onPress={() => router.push('/')}
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
                  borderColor: colors.borderLight,
                  ...Shadows.md,
                  shadowColor: colors.shadowColor,
                }}
              >
                <MaterialCommunityIcons name="wallet-outline" size={24} color={colors.primary} />
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
                backgroundColor: colors.card,
                borderRadius: BorderRadius.lg,
                padding: Spacing.base,
                borderWidth: 1,
                borderColor: colors.borderLight,
                ...Shadows.sm,
                shadowColor: colors.shadowColor,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <UserAvatar
                  name={user?.full_name}
                  email={user?.email}
                  avatarUrl={user?.avatar_url}
                  size={44}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }} numberOfLines={1}>
                    {user?.full_name || 'Signed in user'}
                  </Text>
                  <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }} numberOfLines={1}>
                    {user?.email || 'No email available'}
                  </Text>
                </View>
              </View>

              <View style={{ gap: 10, marginTop: Spacing.base }}>
                <Button
                  title="Settings"
                  onPress={() => router.push('/settings' as any)}
                  variant="outline"
                  size="sm"
                  fullWidth
                  icon="cog-outline"
                />
                <Button
                  title="Sign out"
                  onPress={handleSignOut}
                  variant="ghost"
                  size="sm"
                  fullWidth
                  icon="logout"
                />
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
              borderBottomWidth: 1,
              borderBottomColor: colors.borderLight,
              backgroundColor: colors.background,
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
                  backgroundColor: hovered ? colors.surfaceElevated : colors.card,
                  borderWidth: 1,
                  borderColor: hovered ? `${colors.primary}38` : colors.borderLight,
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
                  backgroundColor: hovered ? colors.surfaceElevated : colors.card,
                  borderWidth: 1,
                  borderColor: hovered ? `${colors.primary}40` : colors.borderLight,
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
                  backgroundColor: hovered ? colors.surfaceElevated : colors.card,
                  borderWidth: 1,
                  borderColor: hovered ? `${colors.primary}40` : colors.borderLight,
                  transform: hovered && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
                })}
              >
                <MaterialCommunityIcons name="help-circle-outline" size={20} color={colors.textPrimary} />
              </Pressable>

              {showMonthMenu && (
                <View
                  style={{
                    position: 'absolute',
                    top: 54,
                    right: 108,
                    width: 260,
                    backgroundColor: colors.surface,
                    borderRadius: BorderRadius.lg,
                    borderWidth: 1,
                    borderColor: colors.borderLight,
                    ...Shadows.lg,
                    shadowColor: colors.shadowColor,
                    padding: Spacing.sm,
                    zIndex: 20,
                  }}
                >
                  {months.map((month) => {
                    const active = month.key === selectedMonthKey;
                    return (
                      <Pressable
                        key={month.key}
                        accessibilityRole="button"
                        accessibilityLabel={`Show ${month.label}`}
                        accessibilityState={{ selected: active }}
                        onPress={() => {
                          setSelectedMonthKey(month.key);
                          setShowMonthMenu(false);
                        }}
                        style={({ hovered }: any) => ({
                          paddingHorizontal: Spacing.md,
                          paddingVertical: 10,
                          borderRadius: BorderRadius.md,
                          backgroundColor: active ? colors.primaryBg : hovered ? `${colors.primary}10` : 'transparent',
                        })}
                      >
                        <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>
                          {month.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
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
              paddingTop: Spacing['2xl'],
              paddingBottom: insets.bottom + Spacing['2xl'],
            }}
          >
            <View
              nativeID="main-content"
              accessibilityRole="main"
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

export default DesktopShell;
