import React from 'react';
import { Link } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { LEARN_ARTICLES } from '@/content/learn';

const learnHighlights = [
  {
    icon: 'wallet-outline',
    title: 'Budgeting without rigid rules',
    copy: 'Small, steady habits that work when income or expenses change month to month.',
  },
  {
    icon: 'account-group-outline',
    title: 'Shared money made calmer',
    copy: 'Practical guidance for roommates, couples, and families handling shared costs.',
  },
  {
    icon: 'shield-alert-outline',
    title: 'Better first-aid planning',
    copy: 'Clear next steps when money feels tight and you need breathing room quickly.',
  },
] as const;

export default function LearnCenterScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: Spacing.base,
          paddingTop: Spacing.md,
          paddingBottom: 160,
        }}
      >
        <View style={{ gap: Spacing.sm, marginBottom: Spacing.lg }}>
          <Text
            style={{
              fontSize: Typography.fontSize.xl,
              fontFamily: Typography.fontFamily.display,
              color: colors.textPrimary,
            }}
          >
            Learn
          </Text>
          <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20, maxWidth: 620 }}>
            Short, useful guidance for budgeting, shared expenses, and calm money routines. Built for real people, not filler.
          </Text>
        </View>

        <Card variant="elevated" borderRadius="2xl" style={{ marginBottom: Spacing.lg, padding: Spacing.lg }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
            {learnHighlights.map((item) => (
              <View
                key={item.title}
                style={{
                  flexGrow: 1,
                  flexBasis: 220,
                  gap: Spacing.sm,
                  padding: Spacing.md,
                  borderRadius: BorderRadius.lg,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                  minHeight: 132,
                }}
              >
                <View style={{
                  width: 38,
                  height: 38,
                  borderRadius: BorderRadius.md,
                  backgroundColor: colors.primaryBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <MaterialCommunityIcons name={item.icon as any} size={20} color={colors.primary} />
                </View>
                <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                  {item.title}
                </Text>
                <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
                  {item.copy}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.sm }}>
          Featured articles
        </Text>

        <View style={{ gap: Spacing.md }}>
          {LEARN_ARTICLES.map((article, index) => (
            <Link key={article.slug} href={`/learn/${article.slug}` as any} asChild>
              <TouchableOpacity activeOpacity={0.85}>
                <Card
                  variant={index === 0 ? 'elevated' : 'default'}
                  borderRadius="2xl"
                  style={{
                    gap: Spacing.sm,
                    overflow: 'hidden',
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md }}>
                    <View style={{ flex: 1, gap: 6 }}>
                      <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textTertiary }}>
                        {article.category} · {article.readingTime}
                      </Text>
                      <Text
                        style={{
                          fontSize: Typography.fontSize.lg,
                          lineHeight: Typography.lineHeight.lg,
                          fontFamily: Typography.fontFamily.semiBold,
                          color: colors.textPrimary,
                        }}
                      >
                        {article.title}
                      </Text>
                      <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 20, color: colors.textSecondary }}>
                        {article.description}
                      </Text>
                    </View>
                    <View
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: BorderRadius.full,
                        backgroundColor: colors.primaryBg,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <MaterialCommunityIcons name="arrow-top-right" size={20} color={colors.primary} />
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.xs }}>
                    {article.keywords.slice(0, 3).map((keyword) => (
                      <View
                        key={keyword}
                        style={{
                          paddingHorizontal: Spacing.sm,
                          paddingVertical: 6,
                          borderRadius: BorderRadius.full,
                          backgroundColor: colors.surface,
                          borderWidth: 1,
                          borderColor: colors.borderLight,
                        }}
                      >
                        <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
                          {keyword}
                        </Text>
                      </View>
                    ))}
                  </View>
                </Card>
              </TouchableOpacity>
            </Link>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
