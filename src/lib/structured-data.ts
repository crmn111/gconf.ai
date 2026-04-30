// Schema.org JSON-LD generators for gconf.ai.
//
// Public entry point: `generateBlogPostingGraph(...)` returns a single
// `@graph` document for blog post pages — Google's recommended pattern when
// multiple entity types appear on one page. The graph contains:
//
//   • Organization        — publisher / brand
//   • WebSite             — site root + sitelinks search action
//   • WebPage             — the article URL itself
//   • BlogPosting         — the article (more specific than Article)
//   • Person              — author (when available)
//   • ImageObject         — featured image
//   • BreadcrumbList      — page trail
//
// Standalone helpers (`generateWebsiteSchema`, `generateBreadcrumbSchema`)
// remain so non-article pages can keep using them.

import type { BlogPost, BlogPublisher } from './api';

const ORG = {
  name: 'gconf.ai',
  url: 'https://gconf.ai',
  defaultLanguage: 'en',
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

function splitKeywords(meta: string | null | undefined): string[] {
  if (!meta) return [];
  return meta
    .split(/[,;]/)
    .map((k) => k.trim())
    .filter((k) => k.length > 0);
}

// ── Standalone helpers (kept for back-compat with other pages) ──────────

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
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${root}/blog?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
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

/**
 * Kept for back-compat. Prefer `generateBlogPostingGraph` for blog post
 * pages so we emit one combined @graph instead of multiple scripts.
 */
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
    '@type': 'BlogPosting',
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

// ── Organization / WebPage ──────────────────────────────────────────────

export function generateOrganizationSchema(baseUrl: string) {
  const root = baseUrl || ORG.url;
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${root}#organization`,
    name: ORG.name,
    url: root,
    logo: { '@type': 'ImageObject', url: `${root}/logo.png` },
  };
}

// ── Combined @graph for blog post pages ─────────────────────────────────

export interface BlogPostingGraphInput {
  post: BlogPost;
  publishers: BlogPublisher[] | null | undefined;
  baseUrl: string;
  /** Trail used for the breadcrumb. */
  breadcrumb?: { name: string; url?: string }[];
}

/**
 * Emit a single Schema.org `@graph` describing every entity on a blog post
 * page. Cross-referenced via `@id`, which is what Google parsers prefer
 * (one `<script>` tag, no duplication of publisher/author across blocks).
 */
export function generateBlogPostingGraph({
  post,
  publishers,
  baseUrl,
  breadcrumb,
}: BlogPostingGraphInput) {
  const root = baseUrl || ORG.url;
  const canonicalUrl =
    post.seo?.canonical_url || `${root}/blog/${post.slug}`;
  const image = absolute(post.featured_image, root);
  const author = publishers?.find((p) => p.role === 'author');
  const editors = (publishers ?? []).filter((p) => p.role === 'editor');
  const keywords = splitKeywords(post.seo?.meta_keywords);
  const description =
    post.seo?.meta_description ||
    post.seo?.og_description ||
    post.meta_description ||
    undefined;

  const orgId = `${root}#organization`;
  const websiteId = `${root}#website`;
  const webPageId = `${canonicalUrl}#webpage`;
  const articleId = `${canonicalUrl}#blogposting`;
  const imageId = image ? `${canonicalUrl}#primaryimage` : undefined;
  const authorId = author ? `${root}/about#author-${author.slug || author.id}` : undefined;

  const graph: Record<string, unknown>[] = [];

  // Organization
  graph.push({
    '@type': 'Organization',
    '@id': orgId,
    name: ORG.name,
    url: root,
    logo: {
      '@type': 'ImageObject',
      '@id': `${root}#logo`,
      url: `${root}/logo.png`,
      caption: ORG.name,
    },
  });

  // Website (with sitelinks search action)
  graph.push({
    '@type': 'WebSite',
    '@id': websiteId,
    url: root,
    name: ORG.name,
    publisher: { '@id': orgId },
    inLanguage: ORG.defaultLanguage,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${root}/blog?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  });

  // Featured image (optional)
  if (image && imageId) {
    graph.push({
      '@type': 'ImageObject',
      '@id': imageId,
      url: image,
      contentUrl: image,
      ...(post.title && { caption: post.title }),
    });
  }

  // WebPage
  graph.push({
    '@type': 'WebPage',
    '@id': webPageId,
    url: canonicalUrl,
    name: post.seo?.meta_title || post.meta_title || post.title,
    isPartOf: { '@id': websiteId },
    ...(imageId && { primaryImageOfPage: { '@id': imageId } }),
    ...(description && { description }),
    inLanguage: ORG.defaultLanguage,
    ...(post.published_at && { datePublished: post.published_at }),
    ...(post.last_updated && { dateModified: post.last_updated }),
    ...(breadcrumb && breadcrumb.length > 0 && {
      breadcrumb: { '@id': `${webPageId}#breadcrumb` },
    }),
  });

  // Author (Person, optional)
  if (author && authorId) {
    graph.push({
      '@type': 'Person',
      '@id': authorId,
      name: author.name,
      ...(author.image && { image: absolute(author.image, root) }),
      ...(author.slug && { url: `${root}/authors/${author.slug}` }),
    });
  }

  // BlogPosting (the article itself)
  graph.push({
    '@type': 'BlogPosting',
    '@id': articleId,
    isPartOf: { '@id': webPageId },
    mainEntityOfPage: { '@id': webPageId },
    url: canonicalUrl,
    headline: post.title,
    ...(description && { description }),
    ...(image && { image: { '@id': imageId } }),
    ...(post.published_at && { datePublished: post.published_at }),
    ...(post.last_updated && { dateModified: post.last_updated }),
    ...(authorId && { author: { '@id': authorId } }),
    ...(editors.length > 0 && {
      editor: editors.map((e) => ({
        '@type': 'Person',
        name: e.name,
        ...(e.image && { image: absolute(e.image, root) }),
      })),
    }),
    publisher: { '@id': orgId },
    inLanguage: ORG.defaultLanguage,
    ...(keywords.length > 0 && { keywords }),
    ...(post.reading_time && {
      wordCount: post.reading_time * 200,
      timeRequired: `PT${post.reading_time}M`,
    }),
  });

  // Breadcrumb
  if (breadcrumb && breadcrumb.length > 0) {
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${webPageId}#breadcrumb`,
      itemListElement: breadcrumb.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.name,
        ...(item.url && { item: item.url }),
      })),
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}
