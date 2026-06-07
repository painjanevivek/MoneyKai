import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions, Animated, Image } from 'react-native';
import { Link, Redirect, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { SafeAreaView } from 'react-native-safe-area-context';

const HIGHLIGHTS = [
  {
    label: 'Daily flow',
    title: 'One place to see where money is going',
    body: 'Spending, savings, shared costs, and backups stay visible without making the app feel heavy.',
    icon: 'clock-outline',
  },
  {
    label: 'Shared costs',
    title: 'Group expenses that stay easy to follow',
    body: 'Split bills, track who paid, and keep the conversation around money simple for everyone involved.',
    icon: 'account-group-outline',
  },
  {
    label: 'Peace of mind',
    title: 'Backups that travel with the account',
    body: 'Transactions, notes, and settings stay ready to restore when cloud sync is turned on.',
    icon: 'cloud-check-outline',
  },
];

const PRODUCT_TAGS = [
  'For one person or many',
  'Private by design',
  'Works on web and mobile',
  'Ready for cloud backup',
];

export default function LandingScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isWide = width >= 960;
  const [scrollY] = useState(() => new Animated.Value(0));

  const heroShift = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 420],
        outputRange: [0, -42],
        extrapolate: 'clamp',
      }),
    [scrollY]
  );

  const previewLift = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 340],
        outputRange: [0, -18],
        extrapolate: 'clamp',
      }),
    [scrollY]
  );

  const sectionFade = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [180, 430],
        outputRange: [0.35, 1],
        extrapolate: 'clamp',
      }),
    [scrollY]
  );

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingHorizontal: Spacing.base,
          paddingBottom: Spacing['3xl'],
        }}
      >
        <View style={{ maxWidth: 1180, alignSelf: 'center', width: '100%' }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: Spacing.base,
              paddingBottom: Spacing.lg,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 16,
                  backgroundColor: colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                  ...Shadows.md,
                  shadowColor: colors.shadowColor,
                }}
              >
                <Image
                  source={require('../../assets/images/moneykai-logo.png')}
                  style={{ width: 36, height: 36 }}
                  resizeMode="contain"
                />
              </View>
              <View>
                <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                  MoneyKai
                </Text>
                <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
                  Calm money management for real life
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={{
                    paddingHorizontal: Spacing.md,
                    paddingVertical: 10,
                    borderRadius: BorderRadius.full,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                  }}
                >
                  <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                    Sign in
                  </Text>
                </TouchableOpacity>
              </Link>
              <Link href="/(auth)/signup" asChild>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={{
                    paddingHorizontal: Spacing.md,
                    paddingVertical: 10,
                    borderRadius: BorderRadius.full,
                    backgroundColor: colors.primary,
                    ...Shadows.sm,
                    shadowColor: colors.primary,
                  }}
                >
                  <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textInverse }}>
                    Create account
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>

          <View
            style={{
              flexDirection: isWide ? 'row' : 'column',
              alignItems: isWide ? 'center' : 'stretch',
              gap: Spacing.xl,
              paddingVertical: Spacing.lg,
            }}
          >
            <Animated.View style={{ flex: 1.05, gap: Spacing.lg, transform: [{ translateY: heroShift }] }}>
              <View
                style={{
                  alignSelf: 'flex-start',
                  width: isWide ? 124 : 104,
                  height: isWide ? 124 : 104,
                  borderRadius: 28,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...Shadows.lg,
                  shadowColor: colors.shadowColor,
                }}
              >
                <Image
                  source={require('../../assets/images/moneykai-logo.png')}
                  style={{ width: isWide ? 90 : 74, height: isWide ? 90 : 74 }}
                  resizeMode="contain"
                />
              </View>

              <View
                style={{
                  alignSelf: 'flex-start',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingHorizontal: Spacing.md,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                }}
              >
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 999,
                    backgroundColor: colors.primary,
                  }}
                />
                <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textSecondary }}>
                  Quiet, clean, and easy to trust
                </Text>
              </View>

              <Text
                style={{
                  fontSize: isWide ? 58 : 42,
                  lineHeight: isWide ? 60 : 44,
                  fontFamily: Typography.fontFamily.display,
                  color: colors.textPrimary,
                  maxWidth: 660,
                }}
              >
                Money management that feels calm, not crowded.
              </Text>

              <Text
                style={{
                  maxWidth: 600,
                  fontSize: Typography.fontSize.md,
                  lineHeight: 26,
                  color: colors.textSecondary,
                }}
              >
                MoneyKai brings budgeting, shared expenses, savings, and cloud backups into one quiet space so each person gets a view that fits them.
              </Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
                {PRODUCT_TAGS.map((tag) => (
                  <View
                    key={tag}
                    style={{
                      minWidth: 150,
                      padding: Spacing.md,
                      borderRadius: BorderRadius.full,
                      backgroundColor: colors.card,
                      borderWidth: 1,
                      borderColor: colors.borderLight,
                    }}
                  >
                    <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary, textAlign: 'center' }}>
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={{ flexDirection: isWide ? 'row' : 'column', gap: Spacing.sm, marginTop: Spacing.sm }}>
                <Button
                  title="Create account"
                  onPress={() => router.push('/(auth)/signup')}
                  size="lg"
                  style={{ minWidth: isWide ? 180 : '100%' }}
                />
                <Button
                  title="Sign in"
                  onPress={() => router.push('/(auth)/login')}
                  size="lg"
                  variant="outline"
                  style={{ minWidth: isWide ? 160 : '100%' }}
                />
              </View>

              <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textTertiary }}>
                Already have an account? {' '}
                <Text onPress={() => router.push('/(auth)/login')} style={{ color: colors.primary, fontFamily: Typography.fontFamily.semiBold }}>
                  Open login
                </Text>
              </Text>
            </Animated.View>

            <Animated.View style={{ flex: 0.95, width: '100%', transform: [{ translateY: previewLift }] }}>
              <View
                style={{
                  borderRadius: 34,
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                  padding: Spacing.md,
                  ...Shadows.xl,
                  shadowColor: colors.shadowColor,
                }}
              >
                <LinearGradient
                  colors={[`${colors.primary}08`, `${colors.primary}16`, `${colors.surface}`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    minHeight: isWide ? 520 : 460,
                    borderRadius: 28,
                    padding: Spacing.lg,
                    overflow: 'hidden',
                  }}
                >
                  <View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      top: -26,
                      right: -18,
                      width: 210,
                      height: 210,
                      borderRadius: 999,
                      backgroundColor: `${colors.primary}10`,
                    }}
                  />
                  <View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      left: -42,
                      bottom: 68,
                      width: 150,
                      height: 150,
                      borderRadius: 999,
                      backgroundColor: `${colors.accent}12`,
                    }}
                  />

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl }}>
                    <View>
                      <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textTertiary }}>
                        Today
                      </Text>
                      <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                        A live preview
                      </Text>
                    </View>
                    <View
                      style={{
                        paddingHorizontal: Spacing.md,
                        paddingVertical: 8,
                        borderRadius: 999,
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.borderLight,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: colors.primary }} />
                      <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
                        live on the web
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      borderRadius: 26,
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.borderLight,
                      padding: Spacing.lg,
                      marginBottom: Spacing.md,
                      overflow: 'hidden',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: Spacing.md }}>
                      <View>
                        <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>
                          Personalized budget view
                        </Text>
                        <Text
                          style={{
                            fontSize: isWide ? 26 : 22,
                            lineHeight: isWide ? 30 : 26,
                            fontFamily: Typography.fontFamily.semiBold,
                            color: colors.textPrimary,
                            maxWidth: 390,
                          }}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
                          Made to fit different routines
                        </Text>
                      </View>
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        gap: 4,
                        marginTop: 2,
                      }}
                    >
                      <View
                        style={{
                          flex: 3,
                          height: 10,
                          borderRadius: 999,
                          backgroundColor: colors.primary,
                        }}
                      />
                      <View
                        style={{
                          flex: 5,
                          height: 10,
                          borderRadius: 999,
                          backgroundColor: colors.primaryBg,
                        }}
                      />
                      <View
                        style={{
                          flex: 2,
                          height: 10,
                          borderRadius: 999,
                          backgroundColor: colors.primaryBg,
                          opacity: 0.65,
                        }}
                        />
                      </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.sm }}>
                      <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>
                        built for each person
                      </Text>
                      <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>
                        no preset numbers
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: Spacing.md, flexWrap: 'wrap' }}>
                      <View
                        style={{
                          flex: 1,
                          minWidth: 180,
                          borderRadius: 22,
                          padding: Spacing.md,
                          backgroundColor: colors.surface,
                          borderWidth: 1,
                          borderColor: colors.borderLight,
                          overflow: 'hidden',
                        }}
                      >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <MaterialCommunityIcons name="account-group-outline" size={18} color={colors.primary} />
                        <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                          Shared spaces
                        </Text>
                      </View>
                      <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, lineHeight: 18 }} numberOfLines={3}>
                        Designed for roommates, couples, families, and small teams that share costs in different ways.
                      </Text>
                    </View>

                      <View
                        style={{
                          flex: 1,
                          minWidth: 180,
                          borderRadius: 22,
                          padding: Spacing.md,
                          backgroundColor: colors.surface,
                          borderWidth: 1,
                          borderColor: colors.borderLight,
                          overflow: 'hidden',
                        }}
                      >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <MaterialCommunityIcons name="cloud-check-outline" size={18} color={colors.primary} />
                        <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                          Backup ready
                        </Text>
                      </View>
                      <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, lineHeight: 18 }} numberOfLines={3}>
                        Backups are ready when cloud sync is turned on for the account.
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </Animated.View>
          </View>

          <Animated.View style={{ marginTop: Spacing['3xl'], gap: Spacing.md, opacity: sectionFade }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textTertiary }}>
                Why people keep it open
              </Text>
              <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textTertiary }}>
                Simple, polished, useful
              </Text>
            </View>

            <View style={{ flexDirection: isWide ? 'row' : 'column', gap: Spacing.md }}>
              {HIGHLIGHTS.map((item) => (
                <View
                  key={item.title}
                  style={{
                    flex: 1,
                    backgroundColor: colors.card,
                    borderRadius: BorderRadius.xl,
                    borderWidth: 1,
                    borderColor: colors.borderLight,
                    padding: Spacing.lg,
                    minHeight: 190,
                  }}
                >
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 14,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: colors.primaryBg,
                      marginBottom: Spacing.md,
                    }}
                  >
                    <MaterialCommunityIcons name={item.icon as any} size={20} color={colors.primary} />
                  </View>
                  <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textTertiary, marginBottom: 8 }}>
                    {item.label}
                  </Text>
                  <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, lineHeight: 26 }}>
                    {item.title}
                  </Text>
                  <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 20, color: colors.textSecondary }}>
                    {item.body}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>

          <View style={{ alignItems: 'center', marginTop: Spacing['3xl'], marginBottom: Spacing['2xl'] }}>
            <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textTertiary, textAlign: 'center', lineHeight: 20 }}>
              MoneyKai keeps the homepage open, the login route separate, and the app easy to return to.
            </Text>
          </View>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
