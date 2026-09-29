import React from 'react';
import { ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { MoneyKaiBrandMark } from '@/components/branding/MoneyKaiBrandMark';
import { RunawayRouteAnimation } from '@/components/branding/RunawayRouteAnimation';
import { Button } from '@/components/ui/Button';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useAuthStore } from '@/stores/useAuthStore';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'NotFound'>;
const colors = Colors.light;

export function NotFoundScreen({ navigation }: Props) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { width } = useWindowDimensions();

  const goHome = () => {
    navigation.dispatch(CommonActions.reset({
      index: 0,
      routes: [{ name: isAuthenticated ? 'App' : 'Auth' }],
    }));
  };

  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      goHome();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: width < 360 ? Spacing.md : Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.xl }}
      >
        <View style={{ width: '100%', maxWidth: 520, flex: 1, alignSelf: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
            <MoneyKaiBrandMark size={34} />
            <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.xl }}>
              MoneyKai
            </Text>
          </View>

          <View style={{ alignItems: 'center', paddingVertical: Spacing.xl }}>
            <RunawayRouteAnimation />

            <View style={{ width: '100%', marginTop: Spacing.lg }}>
              <View
                style={{
                  alignSelf: 'flex-start', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
                  borderRadius: BorderRadius.full, backgroundColor: colors.primaryBg,
                  borderWidth: 1, borderColor: colors.borderLight,
                }}
              >
                <Text style={{ color: colors.textSecondary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.xs, letterSpacing: 0.7 }}>
                  404 · UNBUDGETED DETOUR
                </Text>
              </View>

              <Text
                accessibilityRole="header"
                style={{ marginTop: Spacing.lg, color: colors.textPrimary, fontFamily: Typography.fontFamily.bold, fontSize: 34, lineHeight: 40, letterSpacing: -1.2 }}
              >
                This page went off-budget.
              </Text>
              <Text style={{ marginTop: Spacing.md, color: colors.textSecondary, fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.lg, lineHeight: 23 }}>
                A runaway receipt made off with this route. We froze its tiny card, but the page is still nowhere to be found.
              </Text>

              <View style={{ gap: Spacing.md, marginTop: Spacing['2xl'] }}>
                <Button title={isAuthenticated ? 'Take me home' : 'Go to sign in'} icon="home-outline" size="lg" fullWidth onPress={goHome} />
                <Button title="Retrace my steps" icon="arrow-left" variant="outline" size="lg" fullWidth onPress={goBack} />
              </View>
            </View>
          </View>

          <Text style={{ color: colors.textTertiary, fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.xs, textAlign: 'center' }}>
            No money was harmed in this navigation.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
