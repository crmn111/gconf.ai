// Type definitions shared with the ep-api multi-tenant backend.
// Only what gconf.ai actually reads — blog + SEO.

export interface SEOSettings {
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image?: string | null;
  og_type?: string | null;
  robots_tag?: string | null;
  canonical_url?: string | null;
  structured_data?: Record<string, unknown> | null;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  published_at: string;
  featured_image: string | null;
  reading_time: number;
  created_at: string;
  last_updated: string;
  author_id?: string;
  meta_title?: string;
  meta_description?: string;
  editors?: string[];
  deleted_at?: string | null;
  // The detail endpoint returns a JSON string of content blocks.
  content?: string;
  seo?: SEOSettings;
}

export interface BlogContentBlock {
  id: string;
  type: 'markdown' | 'gallery' | 'carousel' | 'youtube' | 'tweet' | 'lottie';
  content?: string;
  title?: string;
  galleryId?: string;
  carouselId?: string;
  videoUrl?: string;
  tweetUrl?: string;
  // Lottie-only fields
  animationData?: unknown;
  fileName?: string;
  loop?: boolean;
  autoplay?: boolean;
  width?: number;         // legacy px
  widthCss?: string;      // e.g. "100%", "640px", "80vw"
  alignment?: 'left' | 'center' | 'right';
  textColor?: string;     // hex, applied via CSS on svg text/tspan
  fontFamily?: string;    // CSS font stack, applied via CSS on svg text/tspan
  published: boolean;
}

export interface BlogPublisher {
  id: string;
  name: string;
  slug?: string;
  image?: string;
  role: 'author' | 'editor';
}

export interface GalleryPhoto {
  id: string;
  url: string;
  filename?: string;
  alt_text?: string | null;
  gallery_id?: string | null;
  carousel_id?: string | null;
}
