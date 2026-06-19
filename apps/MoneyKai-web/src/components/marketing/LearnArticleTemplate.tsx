import React from 'react';
import { Link } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { PublicShell, SectionCard } from '@/components/marketing/PublicShell';
import { SeoHead } from '@/components/marketing/SeoHead';
import type { LearnArticle, LearnFaq, LearnSection } from '@/data/learnArticles';
import { SITE } from '@/constants/site';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));

function RenderFaq({ faq }: { faq: LearnFaq }) {
  const { colors } = useTheme();
  return (
    <SectionCard>
      <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
        {faq.question}
      </Text>
      <Text style={{ marginTop: 8, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
        {faq.answer}
      </Text>
    </SectionCard>
  );
}

function renderParagraphs(paragraphs: string[] | undefined, color: string) {
  if (!paragraphs?.length) return null;
  return paragraphs.map((paragraph) => (
    <Text key={paragraph} style={{ fontSize: Typography.fontSize.sm, lineHeight: 24, color }}>
      {paragraph}
    </Text>
  ));
}

function renderBullets(items: string[] | undefined, color: string, bulletColor: string) {
  if (!items?.length) return null;
  return (
    <View style={{ gap: 10 }}>
      {items.map((item) => (
        <View key={item} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
          <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: bulletColor, marginTop: 8 }} />
          <Text style={{ flex: 1, fontSize: Typography.fontSize.sm, lineHeight: 22, color }}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function renderNumbered(items: string[] | undefined, color: string, accent: string, textInverse: string) {
  if (!items?.length) return null;
  return (
    <View style={{ gap: 12 }}>
      {items.map((item, index) => (
        <View key={item} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 999,
              backgroundColor: accent,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 1,
            }}
          >
            <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: textInverse }}>
              {index + 1}
            </Text>
          </View>
          <Text style={{ flex: 1, fontSize: Typography.fontSize.sm, lineHeight: 22, color }}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function RenderSection({ section }: { section: LearnSection }) {
  const { colors } = useTheme();
  return (
    <SectionCard style={{ gap: Spacing.md }}>
      <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
        {section.heading}
      </Text>
      <View style={{ gap: Spacing.sm }}>
        {renderParagraphs(section.paragraphs, colors.textSecondary)}
        {renderBullets(section.bullets, colors.textSecondary, colors.primary)}
        {renderNumbered(section.numbered, colors.textSecondary, colors.primary, colors.textInverse)}
      </View>
      {section.subSections?.length ? (
        <View style={{ gap: Spacing.md }}>
          {section.subSections.map((subSection) => (
            <View
              key={subSection.id}
              style={{
                marginTop: Spacing.sm,
                paddingTop: Spacing.sm,
                borderTopWidth: 1,
                borderTopColor: colors.borderLight,
                gap: 8,
              }}
            >
              <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                {subSection.heading}
              </Text>
              {renderParagraphs(subSection.paragraphs, colors.textSecondary)}
              {renderBullets(subSection.bullets, colors.textSecondary, colors.primary)}
              {renderNumbered(subSection.numbered, colors.textSecondary, colors.primary, colors.textInverse)}
            </View>
          ))}
        </View>
      ) : null}
    </SectionCard>
  );
}

export function LearnArticleTemplate({
  article,
  relatedArticles,
}: {
  article: LearnArticle;
  relatedArticles: LearnArticle[];
}) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const articlePath = `/learn/${article.slug}`;
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title,
      description: article.metaDescription,
      datePublished: article.publishedAt,
      dateModified: article.updatedAt,
      author: {
        '@type': 'Organization',
        name: article.author,
        url: SITE.url,
      },
      publisher: {
        '@type': 'Organization',
        name: SITE.name,
        url: SITE.url,
        logo: `${SITE.url}/brand/moneykai-mark.jpeg`,
      },
      mainEntityOfPage: `${SITE.url}${articlePath}`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: article.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
        { '@type': 'ListItem', position: 2, name: 'Learn', item: `${SITE.url}/learn` },
        { '@type': 'ListItem', position: 3, name: article.title, item: `${SITE.url}${articlePath}` },
      ],
    },
  ];

  return (
    <>
      <SeoHead
        title={article.metaTitle}
        description={article.metaDescription}
        path={articlePath}
        keywords={article.keywords}
        structuredData={structuredData}
      />
      <PublicShell eyebrow={`MoneyKai Learn · ${article.category}`} title={article.title} description={article.excerpt}>
        <View style={{ gap: Spacing.lg, paddingBottom: Spacing['2xl'] }}>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: Spacing.sm,
              marginBottom: Spacing.sm,
            }}
          >
            <View
              style={{
                alignSelf: 'flex-start',
                paddingHorizontal: Spacing.md,
                paddingVertical: 8,
                borderRadius: BorderRadius.full,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.borderLight,
              }}
            >
              <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textSecondary }}>
                {article.category}
              </Text>
            </View>
            <View
              style={{
                alignSelf: 'flex-start',
                paddingHorizontal: Spacing.md,
                paddingVertical: 8,
                borderRadius: BorderRadius.full,
                backgroundColor: colors.primaryBg,
              }}
            >
              <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textSecondary }}>
                {article.readingTime}
              </Text>
            </View>
            <View
              style={{
                alignSelf: 'flex-start',
                paddingHorizontal: Spacing.md,
                paddingVertical: 8,
                borderRadius: BorderRadius.full,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.borderLight,
              }}
            >
              <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textSecondary }}>
                By {article.author} · {formatDate(article.publishedAt)}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: isWide ? 'row' : 'column', gap: Spacing.lg }}>
            <View style={{ flexGrow: 1, flexBasis: isWide ? 460 : undefined, gap: Spacing.md }}>
              <SectionCard variant="elevated" borderRadius="2xl" style={{ gap: Spacing.md, overflow: 'hidden' }}>
                <View style={{ gap: Spacing.sm }}>
                  <Text
                    style={{
                      fontSize: isWide ? Typography.fontSize['4xl'] : Typography.fontSize['3xl'],
                      lineHeight: isWide ? Typography.lineHeight['4xl'] : 40,
                      fontFamily: Typography.fontFamily.display,
                      color: colors.textPrimary,
                    }}
                  >
                    {article.title}
                  </Text>
                  <Text style={{ fontSize: Typography.fontSize.md, lineHeight: 26, color: colors.textSecondary }}>
                    {article.description}
                  </Text>
                </View>
                <View
                  style={{
                    marginTop: Spacing.sm,
                    padding: Spacing.md,
                    borderRadius: BorderRadius.xl,
                    backgroundColor: colors.primaryBg,
                    borderWidth: 1,
                    borderColor: `${colors.primary}20`,
                    gap: 8,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <MaterialCommunityIcons name="image-outline" size={18} color={colors.primary} />
                    <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textSecondary }}>
                      Article image placeholder
                    </Text>
                  </View>
                  <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
                    {article.image.alt}
                  </Text>
                  <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary, lineHeight: 18 }}>
                    {article.image.prompt}
                  </Text>
                </View>
              </SectionCard>
            </View>

            <View style={{ flexGrow: 1, flexBasis: isWide ? 320 : undefined, gap: Spacing.md }}>
              <SectionCard style={{ gap: Spacing.sm }}>
                <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                  Table of contents
                </Text>
                <View style={{ gap: 10 }}>
                  {article.tableOfContents.map((item, index) => (
                    <View key={item.id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                      <View style={{ width: 24, height: 24, borderRadius: 999, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                        <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textSecondary }}>
                          {index + 1}
                        </Text>
                      </View>
                      <Text style={{ flex: 1, fontSize: Typography.fontSize.sm, lineHeight: 20, color: colors.textSecondary }}>
                        {item.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </SectionCard>

              <SectionCard style={{ gap: Spacing.sm }}>
                <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                  Quick facts
                </Text>
                <View style={{ gap: 8 }}>
                  {article.keywords.map((keyword) => (
                    <View key={keyword} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: colors.primary }} />
                      <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary }}>
                        {keyword}
                      </Text>
                    </View>
                  ))}
                </View>
              </SectionCard>
            </View>
          </View>

          <View style={{ gap: Spacing.md }}>
            {article.content.map((section) => (
              <RenderSection key={section.id} section={section} />
            ))}
          </View>

          <SectionCard style={{ gap: Spacing.sm }}>
            <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
              Educational disclaimer
            </Text>
            <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
              This article is for educational purposes only. MoneyKai helps users organize personal finance information but does not provide professional financial, legal, tax, or investment advice.
            </Text>
          </SectionCard>

          <View style={{ gap: Spacing.md }}>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
              Frequently asked questions
            </Text>
            <View style={{ gap: Spacing.md }}>
              {article.faqs.map((faq) => (
                <RenderFaq key={faq.question} faq={faq} />
              ))}
            </View>
          </View>

          <View style={{ gap: Spacing.md }}>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
              Related articles
            </Text>
            <View style={{ flexDirection: isWide ? 'row' : 'column', flexWrap: 'wrap', gap: Spacing.md }}>
              {relatedArticles.map((related) => (
                <Link key={related.slug} href={`/learn/${related.slug}` as any} asChild>
                  <TouchableOpacity activeOpacity={0.82} style={{ flexGrow: 1, flexBasis: 280 }}>
                    <SectionCard style={{ gap: 8 }}>
                      <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textTertiary }}>
                        {related.category} · {related.readingTime}
                      </Text>
                      <Text style={{ fontSize: Typography.fontSize.lg, lineHeight: 24, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                        {related.title}
                      </Text>
                      <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 21, color: colors.textSecondary }}>
                        {related.excerpt}
                      </Text>
                    </SectionCard>
                  </TouchableOpacity>
                </Link>
              ))}
            </View>
          </View>
        </View>
      </PublicShell>
    </>
  );
}


