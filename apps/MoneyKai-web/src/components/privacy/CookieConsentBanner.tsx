import React, { useEffect, useState } from 'react';
import { Link } from 'expo-router';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import {
  type CookieConsentChoice,
  getCookieConsentChoice,
  setCookieConsentChoice,
} from '@/services/cookieConsent';
import { initSentry } from '@/services/sentry';

export function CookieConsentBanner() {
  const { colors } = useTheme();
  const [choice, setChoice] = useState<CookieConsentChoice | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    setChoice(getCookieConsentChoice());
    setReady(true);
  }, []);

  if (Platform.OS !== 'web' || !ready || choice) {
    return null;
  }

  const handleChoice = (nextChoice: CookieConsentChoice) => {
    setCookieConsentChoice(nextChoice);
    setChoice(nextChoice);

    if (nextChoice === 'accepted') {
      void initSentry();
    }
  };

  return (
    <View
      accessibilityRole="alert"
      accessibilityLabel="Cookie consent"
      style={[
        {
          position: 'absolute',
          left: Spacing.base,
          right: Spacing.base,
          bottom: Spacing.base,
          zIndex: 1000,
          maxWidth: 920,
          alignSelf: 'center',
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: BorderRadius.sm,
          padding: Spacing.base,
          ...Shadows.lg,
        },
        Platform.OS === 'web' ? ({ position: 'fixed' } as any) : null,
      ]}
    >
      <View style={{ gap: Spacing.md }}>
        <View style={{ gap: Spacing.xs }}>
          <Text
            style={{
              color: colors.textPrimary,
              fontFamily: Typography.fontFamily.semiBold,
              fontSize: Typography.fontSize.md,
              lineHeight: Typography.lineHeight.md,
            }}
          >
            Cookie choices
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: Typography.fontSize.sm,
              lineHeight: Typography.lineHeight.base,
            }}
          >
            MoneyKai uses necessary browser storage for sign-in, preferences, and security. Optional diagnostics
            and performance telemetry run only if you accept.
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: Spacing.md,
          }}
        >
          <Link href="/privacy-policy" asChild>
            <TouchableOpacity accessibilityRole="link" style={{ paddingVertical: Spacing.sm }}>
              <Text
                style={{
                  color: colors.primary,
                  fontFamily: Typography.fontFamily.semiBold,
                  fontSize: Typography.fontSize.sm,
                }}
              >
                Privacy policy
              </Text>
            </TouchableOpacity>
          </Link>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => handleChoice('declined')}
              style={{
                minHeight: 42,
                justifyContent: 'center',
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: BorderRadius.sm,
                paddingHorizontal: Spacing.lg,
              }}
            >
              <Text
                style={{
                  color: colors.textPrimary,
                  fontFamily: Typography.fontFamily.semiBold,
                  fontSize: Typography.fontSize.sm,
                }}
              >
                Decline
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => handleChoice('accepted')}
              style={{
                minHeight: 42,
                justifyContent: 'center',
                backgroundColor: colors.primary,
                borderRadius: BorderRadius.sm,
                paddingHorizontal: Spacing.lg,
              }}
            >
              <Text
                style={{
                  color: colors.textInverse,
                  fontFamily: Typography.fontFamily.semiBold,
                  fontSize: Typography.fontSize.sm,
                }}
              >
                Accept
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
