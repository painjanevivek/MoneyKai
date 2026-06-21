import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/theme';

const LANGUAGE_STORAGE_KEY = 'moneykai.auth.language';

const LANGUAGE_OPTIONS = [
  'English (India)',
  'Hindi',
  'Bengali',
  'Tamil',
  'Telugu',
  'Marathi',
  'Kannada',
  'Malayalam',
  'Gujarati',
  'Punjabi',
] as const;

const FOOTER_LINKS = [
  ['Help', '/contact'],
  ['Privacy', '/privacy-policy'],
  ['Terms', '/terms'],
] as const;

export function AuthFooter() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const [selectedLanguage, setSelectedLanguage] = useState<(typeof LANGUAGE_OPTIONS)[number]>('English (India)');
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (LANGUAGE_OPTIONS.includes(savedLanguage as (typeof LANGUAGE_OPTIONS)[number])) {
      setSelectedLanguage(savedLanguage as (typeof LANGUAGE_OPTIONS)[number]);
    }
  }, []);

  const handleLanguageSelect = (language: (typeof LANGUAGE_OPTIONS)[number]) => {
    setSelectedLanguage(language);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    setLanguageMenuOpen(false);
  };

  return (
    <View
      style={{
        alignItems: 'center',
        flexDirection: isWide ? 'row' : 'column',
        gap: isWide ? 0 : Spacing.md,
        justifyContent: 'space-between',
        marginTop: Spacing.lg,
        paddingHorizontal: isWide ? Spacing.lg : 0,
        zIndex: 20,
      }}
    >
      <View style={{ position: 'relative', zIndex: 30 }}>
        <TouchableOpacity
          onPress={() => setLanguageMenuOpen((open) => !open)}
          accessibilityRole="button"
          accessibilityLabel="Choose language"
          style={{
            alignItems: 'center',
            flexDirection: 'row',
            gap: Spacing.xs,
            paddingVertical: Spacing.xs,
          }}
        >
          <Text
            style={{
              color: colors.textSecondary,
              fontFamily: Typography.fontFamily.regular,
              fontSize: Typography.fontSize.sm,
            }}
          >
            {selectedLanguage}
          </Text>
          <MaterialCommunityIcons
            name={languageMenuOpen ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        {languageMenuOpen ? (
          <View
            style={{
              backgroundColor: colors.card,
              borderColor: colors.borderLight,
              borderRadius: BorderRadius.md,
              borderWidth: 1,
              left: 0,
              marginTop: Spacing.sm,
              maxHeight: 132,
              minWidth: 190,
              overflow: 'hidden',
              paddingVertical: Spacing.xs,
              position: 'absolute',
              top: '100%',
              ...Shadows.lg,
              shadowColor: colors.shadowColor,
            }}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              {LANGUAGE_OPTIONS.map((language) => {
                const selected = language === selectedLanguage;
                return (
                  <TouchableOpacity
                    key={language}
                    onPress={() => handleLanguageSelect(language)}
                    accessibilityRole="button"
                    accessibilityLabel={`Use ${language}`}
                    style={{
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      paddingHorizontal: Spacing.md,
                      paddingVertical: 10,
                    }}
                  >
                    <Text
                      style={{
                        color: selected ? colors.textPrimary : colors.textSecondary,
                        fontFamily: selected ? Typography.fontFamily.semiBold : Typography.fontFamily.regular,
                        fontSize: Typography.fontSize.sm,
                      }}
                    >
                      {language}
                    </Text>
                    {selected ? <MaterialCommunityIcons name="check" size={15} color={colors.primary} /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', gap: Spacing.lg }}>
        {FOOTER_LINKS.map(([label, href]) => (
          <TouchableOpacity key={label} onPress={() => router.push(href as never)} accessibilityRole="link" accessibilityLabel={label}>
            <Text
              style={{
                color: colors.textSecondary,
                fontFamily: Typography.fontFamily.semiBold,
                fontSize: Typography.fontSize.sm,
              }}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default AuthFooter;
