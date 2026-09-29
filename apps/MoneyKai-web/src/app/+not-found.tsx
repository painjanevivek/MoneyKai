import { Image, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, Stack, usePathname } from 'expo-router';
import Head from 'expo-router/head';

import { RunawayRouteAnimation } from '@/components/marketing/RunawayRouteAnimation';
import { Button } from '@/components/ui/Button';
import { BorderRadius, Colors, type ColorScheme, Spacing, Typography } from '@/constants/theme';

export default function NotFoundScreen() {
  const { width, height } = useWindowDimensions();
  const pathname = usePathname();
  const colors = Colors.jetLuxuryLight as ColorScheme;
  const isWide = width >= 820;
  const compact = width < 420;
  const safePathname = pathname || 'this address';

  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    router.replace('/');
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Page not found', headerShown: false }} />
      <Head>
        <title>Page not found | MoneyKai</title>
        <meta
          name="description"
          content="The page you requested could not be found. Return to MoneyKai or retrace your steps."
        />
        <meta name="robots" content="noindex,follow" />
      </Head>

      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            minHeight: Math.max(height, isWide ? 680 : 720),
            flexGrow: 1,
            paddingHorizontal: compact ? Spacing.base : isWide ? Spacing['4xl'] : Spacing.xl,
            paddingVertical: compact ? Spacing.base : Spacing.xl,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 1180,
              flex: 1,
              alignSelf: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Go to MoneyKai home"
              onPress={() => router.replace('/')}
              style={({ hovered, pressed }: any) => ({
                alignSelf: 'flex-start',
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.sm,
                paddingVertical: Spacing.sm,
                opacity: pressed ? 0.72 : 1,
                transform: hovered ? [{ translateY: -1 }] : [{ translateY: 0 }],
              })}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: BorderRadius.md,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                }}
              >
                <Image
                  source={{ uri: '/brand/moneykai-symbol-logo.svg' }}
                  accessibilityLabel="MoneyKai"
                  style={{ width: 28, height: 28 }}
                  resizeMode="contain"
                />
              </View>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontFamily: Typography.fontFamily.semiBold,
                  fontSize: Typography.fontSize.md,
                  letterSpacing: -0.3,
                }}
              >
                MoneyKai
              </Text>
            </Pressable>

            <View
              style={{
                flex: isWide ? 1 : undefined,
                flexDirection: isWide ? 'row' : 'column-reverse',
                alignItems: 'center',
                justifyContent: 'center',
                gap: isWide ? Spacing['5xl'] : compact ? Spacing.base : Spacing.xl,
                paddingVertical: isWide ? Spacing['2xl'] : Spacing.base,
              }}
            >
              <View style={{ flex: isWide ? 1 : undefined, width: '100%', maxWidth: 520 }}>
                <View
                  style={{
                    alignSelf: 'flex-start',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 7,
                    paddingHorizontal: Spacing.md,
                    paddingVertical: 7,
                    borderRadius: BorderRadius.full,
                    backgroundColor: colors.primaryBg,
                    borderWidth: 1,
                    borderColor: colors.borderLight,
                  }}
                >
                  <MaterialCommunityIcons name="map-marker-question-outline" size={16} color={colors.primaryDark} />
                  <Text
                    style={{
                      color: colors.primaryDark,
                      fontFamily: Typography.fontFamily.semiBold,
                      fontSize: Typography.fontSize.xs,
                      letterSpacing: 0.7,
                    }}
                  >
                    404 · UNBUDGETED DETOUR
                  </Text>
                </View>

                <Text
                  accessibilityRole="header"
                  style={{
                    marginTop: Spacing.lg,
                    maxWidth: 510,
                    color: colors.textPrimary,
                    fontFamily: Typography.fontFamily.display,
                    fontSize: isWide ? 54 : compact ? 34 : 40,
                    lineHeight: isWide ? 61 : compact ? 41 : 48,
                    letterSpacing: isWide ? -2.2 : -1.3,
                  }}
                >
                  This page went off-budget.
                </Text>

                <Text
                  style={{
                    marginTop: Spacing.md,
                    maxWidth: 470,
                    color: colors.textSecondary,
                    fontFamily: Typography.fontFamily.regular,
                    fontSize: compact ? Typography.fontSize.base : Typography.fontSize.md,
                    lineHeight: compact ? 22 : 26,
                  }}
                >
                  A runaway receipt made off with this route. We froze its tiny card, but the page is still nowhere to be found.
                </Text>

                <View
                  style={{
                    alignSelf: 'flex-start',
                    maxWidth: '100%',
                    marginTop: Spacing.lg,
                    paddingHorizontal: Spacing.md,
                    paddingVertical: Spacing.sm,
                    borderRadius: BorderRadius.sm,
                    backgroundColor: colors.surfaceElevated,
                    borderWidth: 1,
                    borderColor: colors.borderLight,
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      maxWidth: compact ? 260 : 420,
                      color: colors.textTertiary,
                      fontFamily: Typography.fontFamily.medium,
                      fontSize: Typography.fontSize.xs,
                    }}
                  >
                    LOOKED FOR · {safePathname}
                  </Text>
                </View>

                <View
                  style={{
                    width: '100%',
                    flexDirection: isWide || width >= 520 ? 'row' : 'column',
                    alignItems: isWide || width >= 520 ? 'center' : 'stretch',
                    gap: Spacing.md,
                    marginTop: Spacing.xl,
                  }}
                >
                  <Button
                    title="Take me home"
                    icon="home-outline"
                    size="lg"
                    fullWidth={!isWide && width < 520}
                    onPress={() => router.replace('/')}
                    testID="not-found-home"
                  />

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Go back to the previous page"
                    testID="not-found-back"
                    onPress={goBack}
                    style={({ hovered, pressed }: any) => ({
                      minHeight: 48,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: Spacing.sm,
                      paddingHorizontal: Spacing.lg,
                      borderRadius: BorderRadius.md,
                      borderWidth: 1,
                      borderColor: hovered ? colors.primary : colors.border,
                      backgroundColor: hovered ? colors.primaryBg : colors.surface,
                      opacity: pressed ? 0.75 : 1,
                      transform: pressed ? [{ scale: 0.98 }] : [{ scale: 1 }],
                    })}
                  >
                    <MaterialCommunityIcons name="arrow-left" size={18} color={colors.textPrimary} />
                    <Text
                      style={{
                        color: colors.textPrimary,
                        fontFamily: Typography.fontFamily.semiBold,
                        fontSize: Typography.fontSize.base,
                      }}
                    >
                      Retrace my steps
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View style={{ flex: isWide ? 1 : undefined, width: '100%', alignItems: 'center' }}>
                <RunawayRouteAnimation colors={colors} compact={!isWide} />
              </View>
            </View>

            <Text
              style={{
                alignSelf: 'center',
                color: colors.textTertiary,
                fontFamily: Typography.fontFamily.regular,
                fontSize: Typography.fontSize.xs,
                textAlign: 'center',
              }}
            >
              No money was harmed in this navigation.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
