// Server-side fetchers against the ep-api multi-tenant backend.
// Mirrors chm-website's prefetch pattern, scoped to what gconf.ai needs.

import { getTenantApiKey } from './tenant';
import type { BlogPost, BlogPublisher, GalleryPhoto } from './api';

const EXTERNAL_API_URL = process.env.NEXT_PUBLIC_GCONF_API_URL || '';
const CACHE_DURATION = 60;
const BLOG_CACHE_DURATION = 30;
const CANONICAL_CACHE_DURATION = 300;

// Per-request dedup so multiple callers on one page share one fetch.
const requestCache = new Map<string, Promise<unknown>>();

function getCachedRequest<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const existing = requestCache.get(key);
  if (existing) return existing as Promise<T>;
  const promise = fetcher();
  requestCache.set(key, promise);
  promise.finally(() => {
    setTimeout(() => requestCache.delete(key), 100);
  });
  return promise;
}

async function fetchFromExternalAPI(
  endpoint: string,
  options?: { cacheDuration?: number; tags?: string[]; noAuth?: boolean },
) {
  if (!EXTERNAL_API_URL) return null;
  const apiKey = await getTenantApiKey();
  const cacheKey = `fetch:${apiKey}:${endpoint}`;

  return getCachedRequest(cacheKey, async () => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (!options?.noAuth && apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

      // Append a short tenant hash so Next's fetch cache is keyed per-tenant.
      const separator = endpoint.includes('?') ? '&' : '?';
      const tenantedEndpoint = apiKey
        ? `${endpoint}${separator}_t=${apiKey.substring(0, 8)}`
        : endpoint;

      const response = await fetch(`${EXTERNAL_API_URL}${tenantedEndpoint}`, {
        method: 'GET',
        headers,
        next: {
          revalidate: options?.cacheDuration ?? CACHE_DURATION,
          tags: [
            ...(options?.tags || []),
            ...(apiKey ? [`tenant:${apiKey.substring(0, 8)}`] : []),
          ],
        },
      });
      if (!response.ok) return null;
      const data = await response.json();
      return 'data' in data ? data.data : data;
    } catch (error) {
      console.error(`[prefetch] ${endpoint}:`, error);
      return null;
    }
  });
}

// ── Blog ──────────────────────────────────────────────────────────────

export async function prefetchBlogPosts(): Promise<BlogPost[]> {
  const data = await fetchFromExternalAPI('/blog', {
    cacheDuration: BLOG_CACHE_DURATION,
    tags: ['blog', 'blog-list'],
  });
  if (!data || !Array.isArray(data)) return [];
  return (data as BlogPost[])
    .filter((post) => post.published && !post.deleted_at)
    .sort(
      (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime(),
    );
}

export async function prefetchBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await prefetchBlogPosts();
  const match = posts.find((p) => p.slug === slug || p.id === slug);
  if (!match) return null;

  const detail = await fetchFromExternalAPI(`/blog/${match.id}`, {
    cacheDuration: BLOG_CACHE_DURATION,
    tags: ['blog', `blog-${slug}`, `blog-${match.id}`],
  });
  return (detail as BlogPost | null) ?? null;
}

// Best-effort author/editor name resolution. If the member endpoint isn't
// available for the tenant, JSON-LD + bylines degrade gracefully (no author
// rather than a broken render).
async function resolveBlogPublishers(
  post: Pick<BlogPost, 'author_id' | 'editors'> | null,
): Promise<BlogPublisher[]> {
  if (!post) return [];
  const ids = new Set<string>();
  if (post.author_id) ids.add(post.author_id);
  post.editors?.forEach((id) => ids.add(id));
  if (ids.size === 0) return [];

  const idArray = Array.from(ids);
  const results = await Promise.all(
    idArray.map((id) =>
      fetchFromExternalAPI(`/members/${id}`, { cacheDuration: CACHE_DURATION }),
    ),
  );

  const publishers: BlogPublisher[] = [];
  results.forEach((m, i) => {
    if (!m) return;
    const member = m as {
      id: string;
      person_firstname?: string;
      person_surname?: string;
      person_slug?: string;
      person_photo?: string;
      person_photo_nobg?: string;
    };
    const name = `${member.person_firstname || ''} ${member.person_surname || ''}`.trim();
    if (!name) return;
    publishers.push({
      id: member.id,
      name,
      slug: member.person_slug,
      image: member.person_photo_nobg || member.person_photo,
      role: idArray[i] === post.author_id ? 'author' : 'editor',
    });
  });
  return publishers;
}

export async function prefetchBlogDetailPageData(slug: string) {
  const post = await prefetchBlogPostBySlug(slug);
  const publishers = await resolveBlogPublishers(post);
  return { post, publishers };
}

// ── Gallery photos ────────────────────────────────────────────────────

/**
 * Fetch every photo across all galleries & carousels for this tenant.
 * The blog detail renderer groups them by `gallery_id` / `carousel_id`.
 * Matches the pattern the ep-dashboard preview uses.
 */
export async function prefetchAllGalleryPhotos(): Promise<GalleryPhoto[]> {
  const data = await fetchFromExternalAPI('/gallery', {
    cacheDuration: CACHE_DURATION,
    tags: ['gallery'],
  });
  if (!data || !Array.isArray(data)) return [];
  return (data as Array<Record<string, unknown>>).map((raw) => ({
    id: String(raw.id ?? ''),
    url: String(raw.url ?? raw.photo_url ?? ''),
    filename: typeof raw.filename === 'string' ? raw.filename : undefined,
    alt_text: typeof raw.alt_text === 'string' ? raw.alt_text : null,
    gallery_id: typeof raw.gallery_id === 'string' ? raw.gallery_id : null,
    carousel_id: typeof raw.carousel_id === 'string' ? raw.carousel_id : null,
  }));
}

// ── App details (site-wide logo / favicon / names) ────────────────────

export interface AppDetails {
  app_name?: string;
  app_description?: string;
  logo_header?: string;
  logo_footer?: string;
  logo_dashboard?: string;
  favicon?: string;
  logo_header_scale?: number;
  logo_footer_scale?: number;
  logo_dashboard_scale?: number;
}

/**
 * Fetch the tenant's public-facing branding (logo URLs, favicon, app name).
 * Public endpoint — no auth required.
 */
export async function prefetchAppDetails(): Promise<AppDetails | null> {
  try {
    // Intentionally NOT using noAuth — the endpoint's resolveTenant middleware
    // needs the API key in the Authorization header to identify which tenant's
    // settings to return. Without it the handler falls back to empty strings.
    const data = await fetchFromExternalAPI('/settings/public/app-details', {
      cacheDuration: CANONICAL_CACHE_DURATION,
      tags: ['app-details'],
    });
    return (data as AppDetails | null) ?? null;
  } catch {
    return null;
  }
}

// ── Canonical base URL ────────────────────────────────────────────────

export async function prefetchCanonicalBaseUrl(): Promise<string> {
  try {
    const data = await fetchFromExternalAPI('/settings/public/canonical-base-url', {
      cacheDuration: CANONICAL_CACHE_DURATION,
      noAuth: true,
    });
    const url = (data as { canonical_base_url?: string } | null)?.canonical_base_url;
    return url || process.env.NEXT_PUBLIC_SITE_URL || 'https://gconf.ai';
  } catch {
    return process.env.NEXT_PUBLIC_SITE_URL || 'https://gconf.ai';
  }
}
