import React from 'react';
import { Link } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';
import { WorkspaceHeader } from '@/components/ui/WorkspaceHeader';
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
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{
          paddingHorizontal: Spacing.base,
          paddingTop: Spacing.md,
          paddingBottom: 160,
        }}
      >
        <WorkspaceHeader
          icon="school-outline"
          eyebrow="LEARN CENTER"
          title="Calmer money guidance"
          description="Short, useful guidance for budgeting, shared expenses, and everyday money routines."
          variant="quiet"
          chips={[
            { icon: 'wallet-outline', label: 'Budgeting' },
            { icon: 'account-group-outline', label: 'Shared costs' },
            { icon: 'shield-alert-outline', label: 'First aid' },
          ]}
        />

        <View style={{ flexDirection: isWide ? 'row' : 'column', flexWrap: 'wrap', gap: Spacing.lg, marginVertical: Spacing.xl }}>
          {learnHighlights.map((item, index) => (
            <View
              key={item.title}
              style={{
                flexGrow: 1,
                flexBasis: isWide ? 220 : '100%',
                gap: Spacing.sm,
                paddingLeft: isWide && index > 0 ? Spacing.lg : 0,
                borderLeftWidth: isWide && index > 0 ? 1 : 0,
                borderLeftColor: colors.borderLight,
                minHeight: 120,
              }}
            >
              <View style={{
                width: 38,
                height: 38,
                borderRadius: BorderRadius.md,
                backgroundColor: colors.primaryBg,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: colors.borderLight,
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

        <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.sm }}>
          Featured articles
        </Text>

        <View>
          {LEARN_ARTICLES.map((article) => (
            <Link key={article.slug} href={`/learn/${article.slug}` as any} asChild>
              <TouchableOpacity activeOpacity={0.85}>
                <Card
                  style={{
                    gap: Spacing.sm,
                    overflow: 'hidden',
                    borderBottomWidth: 1,
                    borderBottomColor: colors.borderLight,
                    borderRadius: 0,
                    paddingHorizontal: 0,
                  }}
                >
                  <View style={{ flexDirection: isWide ? 'row' : 'column', justifyContent: 'space-between', gap: Spacing.md }}>
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
                        alignSelf: isWide ? 'auto' : 'flex-end',
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
