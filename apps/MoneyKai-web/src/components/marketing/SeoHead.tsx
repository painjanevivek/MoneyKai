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
};

export function SeoHead({
  title,
  description,
  path = '',
  keywords = [],
  robots = 'index,follow',
  imagePath,
}: SeoHeadProps) {
  const canonical = `${SITE.url}${path}`;
  const imageUrl = imagePath ? `${SITE.url}${imagePath}` : undefined;

  return (
    <Head>
      <title>{SITE.name}</title>
      <meta name="description" content={description} />
      {keywords.length > 0 ? <meta name="keywords" content={keywords.join(', ')} /> : null}
      <meta name="robots" content={robots} />
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
    </Head>
  );
}
