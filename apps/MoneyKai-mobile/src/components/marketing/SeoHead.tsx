import React from 'react';
import Head from 'expo-router/head';
import { SITE } from '@/constants/site';

type SeoHeadProps = {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
};

export function SeoHead({ title, description, path = '', keywords = [] }: SeoHeadProps) {
  const canonical = `${SITE.url}${path}`;

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <meta name="robots" content="index,follow" />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE.name} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <link rel="canonical" href={canonical} />
    </Head>
  );
}
