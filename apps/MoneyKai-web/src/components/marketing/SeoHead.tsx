import React from 'react';
import Head from 'expo-router/head';
import { SITE } from '@/constants/site';

type SeoHeadProps = {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  robots?: string;
  imagePath?: string;
  preloadImageHref?: string;
  structuredData?: JsonLd | JsonLd[];
};

type JsonLd = Record<string, unknown>;

const withoutContext = (schema: JsonLd) => {
  const rest = { ...schema };
  delete rest['@context'];
  return rest;
};

export function SeoHead({
  title,
  description,
  path = '',
  keywords = [],
  robots = 'index,follow',
  imagePath,
  preloadImageHref,
  structuredData,
}: SeoHeadProps) {
  const canonical = `${SITE.url}${path}`;
  const imageUrl = imagePath ? `${SITE.url}${imagePath}` : undefined;
  const siteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    url: SITE.url,
    description,
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
      url: SITE.url,
    },
  };
  const pageSchemas = Array.isArray(structuredData)
    ? structuredData
    : structuredData
      ? [structuredData]
      : [];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [withoutContext(siteSchema), ...pageSchemas.map(withoutContext)],
  };

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords.length > 0 ? <meta name="keywords" content={keywords.join(', ')} /> : null}
      <meta name="robots" content={robots} />
      <meta name="application-name" content={SITE.name} />
      <meta name="apple-mobile-web-app-title" content={SITE.name} />
      <meta name="theme-color" content="#0F766E" />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE.name} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      {imageUrl ? <meta property="og:image" content={imageUrl} /> : null}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {imageUrl ? <meta name="twitter:image" content={imageUrl} /> : null}
      <link rel="canonical" href={canonical} />
      {preloadImageHref ? <link rel="preload" as="image" href={preloadImageHref} fetchPriority="high" /> : null}
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Head>
  );
}
