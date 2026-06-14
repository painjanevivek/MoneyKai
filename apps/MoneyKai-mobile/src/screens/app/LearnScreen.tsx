import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { LEARN_CATEGORIES, getLatestLearnArticles } from '@/data/learnArticles';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { createAppScreenStyles } from './screenStyles';

export function LearnScreen() {
  const { colors } = useTheme();
  const styles = createAppScreenStyles(colors);
  const articles = getLatestLearnArticles(6);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>MoneyKai Learn</Text>
          <Text style={styles.title}>Learn money calmly</Text>
          <Text style={styles.subtitle}>Short guides for budgets, savings, tracking, and everyday decisions. Small reads, big clarity.</Text>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.base }}>
          {LEARN_CATEGORIES.map((category) => (
            <View
              key={category.slug}
              style={{
                backgroundColor: colors.card,
                borderColor: colors.borderLight,
                borderRadius: BorderRadius.full,
                borderWidth: 1,
                paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.sm,
              }}
            >
              <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm }}>
                {category.title}
              </Text>
            </View>
          ))}
        </View>

        {articles.map((article) => (
          <View key={article.slug} style={styles.panel}>
            <View style={{ flexDirection: 'row', gap: Spacing.md }}>
              <View
                style={{
                  alignItems: 'center',
                  backgroundColor: colors.primaryBg,
                  borderRadius: BorderRadius.md,
                  height: 44,
                  justifyContent: 'center',
                  width: 44,
                }}
              >
                <MaterialCommunityIcons name="book-open-page-variant-outline" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.value}>{article.title}</Text>
                <Text style={[styles.muted, { marginTop: 4 }]}>{article.excerpt}</Text>
                <Text style={[styles.muted, { marginTop: Spacing.sm }]}>
                  {article.category} - {article.readingTime}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
