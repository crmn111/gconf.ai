import type { Metadata } from 'next';
import type { SEOSettings } from './api';

export const SEO_DEFAULTS = {
  siteName: 'gconf.ai',
  siteNameShort: 'gconf',
  defaultTitle: 'gconf.ai — the conference, reimagined',
  defaultDescription:
    'Transmissions from the frontier of AI, engineering, and the next generation of conferences.',
  defaultImage: '/og.png',
  twitterCard: 'summary_large_image' as const,
  ogType: 'website' as const,
  defaultRobots: 'all',
} as const;

const PAGE_TITLES: Record<string, string> = {
  home: SEO_DEFAULTS.defaultTitle,
  blog: `Blog · ${SEO_DEFAULTS.siteName}`,
};

const PAGE_DESCRIPTIONS: Record<string, string> = {
  home: SEO_DEFAULTS.defaultDescription,
  blog:
    'Essays and transmissions from gconf.ai — AI, engineering, and conference field notes.',
};

const PAGE_CANONICALS: Record<string, string> = {
  home: '/',
  blog: '/blog',
};

const VALID_OG_TYPES = ['website', 'article', 'profile', 'video.movie'] as const;
type ValidOgType = (typeof VALID_OG_TYPES)[number];

function getValidOgType(ogType: string | undefined | null): ValidOgType {
  if (ogType && (VALID_OG_TYPES as readonly string[]).includes(ogType)) {
    return ogType as ValidOgType;
  }
  return SEO_DEFAULTS.ogType;
}

export function absoluteUrl(
  url: string | null | undefined,
  baseUrl: string,
): string | null {
  if (!url || url.trim() === '') return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function generatePageMetadata(
  seo: SEOSettings | null,
  pageSlug: string,
  baseUrl: string = process.env.NEXT_PUBLIC_SITE_URL || 'https://gconf.ai',
): Metadata {
  const title = seo?.meta_title || PAGE_TITLES[pageSlug] || SEO_DEFAULTS.defaultTitle;
  const description =
    seo?.meta_description || PAGE_DESCRIPTIONS[pageSlug] || SEO_DEFAULTS.defaultDescription;
  const ogTitle = seo?.og_title || title;
  const ogDescription = seo?.og_description || description;
  const ogImage = absoluteUrl(seo?.og_image ?? SEO_DEFAULTS.defaultImage, baseUrl);
  const canonical = seo?.canonical_url || PAGE_CANONICALS[pageSlug] || '/';

  return {
    title,
    description,
    keywords: seo?.meta_keywords || undefined,
    robots: seo?.robots_tag?.toLowerCase() || SEO_DEFAULTS.defaultRobots,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      ...(ogImage && { images: [{ url: ogImage, alt: title }] }),
      type: getValidOgType(seo?.og_type),
      siteName: SEO_DEFAULTS.siteName,
    },
    twitter: {
      card: SEO_DEFAULTS.twitterCard,
      title: ogTitle,
      description: ogDescription,
      ...(ogImage && { images: [ogImage] }),
    },
    alternates: { canonical },
  };
}
