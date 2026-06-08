import React, { type PropsWithChildren, useMemo, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';
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
  { href: '/budgets', label: 'Budgets', icon: 'wallet-outline' },
  { href: '/goals', label: 'Goals', icon: 'target' },
  { href: '/reports', label: 'Reports', icon: 'chart-bar' },
  { href: '/accounts', label: 'Accounts', icon: 'credit-card-outline' },
  { href: '/categories', label: 'Categories', icon: 'shape-outline' },
  { href: '/settings', label: 'Settings', icon: 'cog-outline' },
] as const;

const ROUTE_META: { href: string; title: string; subtitle: string }[] = [
  { href: '/', title: 'Dashboard', subtitle: 'A clear overview of your money' },
  { href: '/transactions', title: 'Transactions', subtitle: 'Track income, expenses, and history' },
  { href: '/budgets', title: 'Budgets', subtitle: 'Review monthly limits and budget health' },
  { href: '/goals', title: 'Goals', subtitle: 'Stay focused on savings progress' },
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
  const months = useMemo(() => getLastSixMonths(), []);
  const [selectedMonthKey, setSelectedMonthKey] = useState(months[months.length - 1]?.key ?? '');
  const [showMonthMenu, setShowMonthMenu] = useState(false);

  const sidebarWidth = width >= 1440 ? 300 : 268;
  const activeMeta = ROUTE_META.find((item) => isRouteActive(pathname, item.href)) ?? ROUTE_META[0];
  const selectedMonthDate = months.find((month) => month.key === selectedMonthKey)?.date ?? months[months.length - 1]?.date ?? new Date();
  const monthRangeLabel = `${formatDate(startOfMonth(selectedMonthDate), 'MMM d')} - ${formatDate(endOfMonth(selectedMonthDate), 'MMM d, yyyy')}`;

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

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
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => router.push('/')}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing['2xl'] }}
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
            </TouchableOpacity>

            <View style={{ gap: 6, marginBottom: Spacing['2xl'] }}>
              {NAV_ITEMS.map((item) => {
                const active = isRouteActive(pathname, item.href);
                return (
                  <TouchableOpacity
                    key={item.href}
                    onPress={() => router.push(item.href as any)}
                    activeOpacity={0.85}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      borderRadius: BorderRadius.md,
                      backgroundColor: active ? colors.primaryBg : 'transparent',
                      borderWidth: 1,
                      borderColor: active ? `${colors.primary}25` : 'transparent',
                    }}
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
                  </TouchableOpacity>
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
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: -120,
              right: -80,
              width: 260,
              height: 260,
              borderRadius: 999,
              backgroundColor: `${colors.primary}04`,
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              bottom: 80,
              left: -120,
              width: 260,
              height: 260,
              borderRadius: 999,
              backgroundColor: `${colors.accent}08`,
            }}
          />

          <View
            style={{
              borderBottomWidth: 1,
              borderBottomColor: colors.borderLight,
              backgroundColor: colors.background,
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

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, position: 'relative' }}>
              <TouchableOpacity
                onPress={() => setShowMonthMenu((current) => !current)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                  borderRadius: BorderRadius.md,
                  paddingHorizontal: Spacing.md,
                  paddingVertical: 10,
                }}
              >
                <MaterialCommunityIcons name="calendar-month-outline" size={18} color={colors.textPrimary} />
                <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary }}>
                  {monthRangeLabel}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={16} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/notifications' as any)}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                }}
              >
                <MaterialCommunityIcons name="bell-outline" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/faq' as any)}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                }}
              >
                <MaterialCommunityIcons name="help-circle-outline" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/settings' as any)}>
                <UserAvatar
                  name={user?.full_name}
                  email={user?.email}
                  avatarUrl={user?.avatar_url}
                  size={42}
                />
              </TouchableOpacity>

              {showMonthMenu && (
                <View
                  style={{
                    position: 'absolute',
                    top: 54,
                    right: 160,
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
                      <TouchableOpacity
                        key={month.key}
                        onPress={() => {
                          setSelectedMonthKey(month.key);
                          setShowMonthMenu(false);
                        }}
                        style={{
                          paddingHorizontal: Spacing.md,
                          paddingVertical: 10,
                          borderRadius: BorderRadius.md,
                          backgroundColor: active ? colors.primaryBg : 'transparent',
                        }}
                      >
                        <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>
                          {month.label}
                        </Text>
                      </TouchableOpacity>
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
              paddingHorizontal: Spacing['2xl'],
              paddingTop: Spacing['2xl'],
              paddingBottom: insets.bottom + Spacing['2xl'],
            }}
          >
            <View style={{ maxWidth: 1440, width: '100%', alignSelf: 'center', flex: 1, minWidth: 0 }}>
              {children}
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default DesktopShell;
