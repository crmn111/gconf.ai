// Schema.org JSON-LD generators for gconf.ai.

import type { BlogPost, BlogPublisher } from './api';

const ORG = {
  name: 'gconf.ai',
  url: 'https://gconf.ai',
};

function stripHtml(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+.+$/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    .replace(/^>\s+/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function cleanText(text: string | undefined | null): string {
  if (!text) return '';
  return stripHtml(stripMarkdown(text));
}

function absolute(url: string | null | undefined, baseUrl: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function generateWebsiteSchema(baseUrl: string) {
  const root = baseUrl || ORG.url;
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: ORG.name,
    url: root,
    publisher: {
      '@type': 'Organization',
      name: ORG.name,
      url: root,
      logo: { '@type': 'ImageObject', url: `${root}/logo.png` },
    },
  };
}

export function generateArticleSchema(
  post: BlogPost | null | undefined,
  publishers: BlogPublisher[] | null | undefined,
  baseUrl: string,
) {
  if (!post?.title) return null;
  const root = baseUrl || ORG.url;
  const image = absolute(post.featured_image, root);
  const canonicalUrl = `${root}/blog/${post.slug}`;
  const author = publishers?.find((p) => p.role === 'author');

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    ...(post.meta_description && { description: post.meta_description }),
    ...(image && { image }),
    url: canonicalUrl,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
    ...(post.published_at && { datePublished: post.published_at }),
    ...(post.last_updated && { dateModified: post.last_updated }),
    ...(author && { author: { '@type': 'Person', name: author.name } }),
    publisher: {
      '@type': 'Organization',
      name: ORG.name,
      logo: { '@type': 'ImageObject', url: `${root}/logo.png` },
    },
    ...(post.reading_time && { wordCount: post.reading_time * 200 }),
  };
}

export function generateBreadcrumbSchema(
  trail: { name: string; url?: string }[],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      ...(item.url && { item: item.url }),
    })),
  };
}
