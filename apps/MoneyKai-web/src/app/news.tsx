import React, { useEffect, useState } from 'react';
import { Image, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Link } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PublicShell, SectionCard } from '@/components/marketing/PublicShell';
import { SeoHead } from '@/components/marketing/SeoHead';
import { fetchLiveNews, NewsApiError } from '@/services/newsApi';
import type { NewsCategory, NewsItem } from '@/types/news';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const FILTERS: { label: string; value: NewsCategory }[] = [
  { label: 'All', value: 'all' },
  { label: 'Finance', value: 'finance' },
  { label: 'Fintech', value: 'fintech' },
];

const formatPublishedAt = (value: string) =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));

function NewsCard({ item }: { item: NewsItem }) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const hasImage = Boolean(item.image);

  return (
    <SectionCard variant="elevated" borderRadius="2xl" style={{ gap: Spacing.md, overflow: 'hidden', minHeight: isWide ? 420 : undefined }}>
      <View
        style={{
          height: 168,
          borderRadius: BorderRadius.lg,
          backgroundColor: colors.primaryBg,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.borderLight,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {hasImage ? (
          <Image
            source={{ uri: item.image as string }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
            accessibilityLabel={`News image for ${item.title}`}
          />
        ) : (
          <View style={{ alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: Spacing.lg }}>
            <MaterialCommunityIcons name="newspaper-variant-outline" size={30} color={colors.primary} />
            <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, textAlign: 'center' }}>
              Live finance and fintech coverage
            </Text>
          </View>
        )}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs }}>
        <View
          style={{
            paddingHorizontal: Spacing.sm,
            paddingVertical: 6,
            borderRadius: BorderRadius.full,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.borderLight,
          }}
        >
          <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textSecondary }}>
            {item.categoryLabel}
          </Text>
        </View>
        <View
          style={{
            paddingHorizontal: Spacing.sm,
            paddingVertical: 6,
            borderRadius: BorderRadius.full,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.borderLight,
          }}
        >
          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>
            {item.source}
          </Text>
        </View>
      </View>

      <Text style={{ fontSize: Typography.fontSize.lg, lineHeight: 26, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
        {item.title}
      </Text>

      <Text numberOfLines={3} style={{ fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
        {item.description}
      </Text>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm, marginTop: 'auto' }}>
        <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>
          {formatPublishedAt(item.publishedAt)}
        </Text>

        <Link href={item.url as any} target="_blank" rel="noopener noreferrer" asChild>
          <TouchableOpacity
            accessibilityRole="link"
            accessibilityLabel={`Read full article: ${item.title}`}
            activeOpacity={0.82}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: Spacing.md,
              paddingVertical: 10,
              borderRadius: BorderRadius.full,
              borderWidth: 1,
              borderColor: colors.borderLight,
              backgroundColor: colors.surface,
            }}
          >
            <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
              Read full article
            </Text>
            <MaterialCommunityIcons name="arrow-top-right" size={16} color={colors.textPrimary} />
          </TouchableOpacity>
        </Link>
      </View>
    </SectionCard>
  );
}

export default function NewsScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const [category, setCategory] = useState<NewsCategory>('all');
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadNews = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchLiveNews(category, refreshing);
        if (cancelled) return;
        setItems(response.items);
        setUpdatedAt(response.updatedAt);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof NewsApiError ? err.message : 'Unable to load the live news feed right now.');
        setItems([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    void loadNews();

    return () => {
      cancelled = true;
    };
  }, [category, refreshing]);

  const handleRefresh = () => {
    setRefreshing(true);
  };

  return (
    <>
      <SeoHead
        title="Latest Finance & Fintech News | MoneyKai"
        description="Read the latest finance, fintech, banking, payments, and personal finance headlines from trusted sources."
        path="/news"
        keywords={['finance news', 'fintech news', 'payments news', 'banking headlines', 'MoneyKai News']}
      />
      <PublicShell
        eyebrow="Live News"
        title="Latest Finance & Fintech News"
        description="Stay updated with recent finance, fintech, banking, payments, and personal finance headlines from trusted sources."
      >
        <View style={{ gap: Spacing['2xl'] }}>
          <SectionCard variant="elevated" borderRadius="2xl" style={{ gap: Spacing.md }}>
            <View style={{ flexDirection: isWide ? 'row' : 'column', justifyContent: 'space-between', gap: Spacing.md }}>
              <View style={{ gap: 8, maxWidth: 820, flex: 1 }}>
                <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                  Live headlines only
                </Text>
                <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                  This feed pulls current finance and fintech headlines from trusted external sources. Each card links to the original source article.
                </Text>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Refresh finance news feed"
                activeOpacity={0.82}
                onPress={handleRefresh}
                style={{
                  alignSelf: isWide ? 'flex-start' : 'stretch',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  paddingHorizontal: Spacing.md,
                  paddingVertical: 12,
                  borderRadius: BorderRadius.full,
                  backgroundColor: colors.primary,
                }}
              >
                <MaterialCommunityIcons name="refresh" size={18} color={colors.textInverse} />
                <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textInverse }}>
                  Refresh feed
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs }}>
              {FILTERS.map((filter) => {
                const active = filter.value === category;
                return (
                  <TouchableOpacity
                    key={filter.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`Show ${filter.label} news`}
                    activeOpacity={0.82}
                    onPress={() => setCategory(filter.value)}
                    style={{
                      paddingHorizontal: Spacing.md,
                      paddingVertical: 10,
                      borderRadius: BorderRadius.full,
                      backgroundColor: active ? colors.textPrimary : colors.surface,
                      borderWidth: 1,
                      borderColor: active ? colors.textPrimary : colors.borderLight,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: Typography.fontSize.sm,
                        fontFamily: Typography.fontFamily.medium,
                        color: active ? colors.textInverse : colors.textPrimary,
                      }}
                    >
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>
              {updatedAt ? `Updated ${formatPublishedAt(updatedAt)}` : 'Updating from live sources'}
            </Text>
          </SectionCard>

          {loading ? (
            <SectionCard style={{ gap: Spacing.sm }}>
              <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                Loading the live feed...
              </Text>
              <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                We are fetching the latest finance and fintech headlines from trusted sources.
              </Text>
            </SectionCard>
          ) : error ? (
            <SectionCard variant="elevated" borderRadius="2xl" style={{ gap: Spacing.sm }}>
              <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                The live feed could not load right now.
              </Text>
              <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                {error}
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Try loading finance news again"
                activeOpacity={0.82}
                onPress={handleRefresh}
                style={{
                  alignSelf: 'flex-start',
                  marginTop: Spacing.xs,
                  paddingHorizontal: Spacing.md,
                  paddingVertical: 10,
                  borderRadius: BorderRadius.full,
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                  backgroundColor: colors.surface,
                }}
              >
                <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                  Try again
                </Text>
              </TouchableOpacity>
            </SectionCard>
          ) : items.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}>
              {items.map((item) => (
                <View key={item.id} style={{ flexGrow: 1, flexBasis: isWide ? 320 : '100%' }}>
                  <NewsCard item={item} />
                </View>
              ))}
            </View>
          ) : (
            <SectionCard variant="elevated" borderRadius="2xl" style={{ gap: Spacing.sm }}>
              <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                No finance news is available right now.
              </Text>
              <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                Please check again later. The feed only shows live finance and fintech stories.
              </Text>
            </SectionCard>
          )}
        </View>
      </PublicShell>
    </>
  );
}
