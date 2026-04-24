import Link from 'next/link';
import type { BlogPost } from '@/lib/api';
import { BlogShell } from './BlogShell';

function formatDate(iso: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function shortSummary(post: BlogPost): string {
  if (post.meta_description) return post.meta_description;
  return '';
}

export function BlogListing({ posts }: { posts: BlogPost[] }) {
  const hasPosts = posts.length > 0;

  return (
    <BlogShell>
      <header className="blog-hero">
        <div className="blog-eyebrow">
          <span className="blog-eyebrow-dot" aria-hidden />
          <span>/transmissions</span>
        </div>
        <h1 className="blog-hero-title">
          field<span className="blog-hero-accent">.</span>notes
        </h1>
        <p className="blog-hero-sub">
          Essays, transmissions, and field notes from gconf.ai — AI, engineering,
          and what the next generation of conferences looks like.
        </p>
        <div className="blog-hero-meta">
          <span className="blog-tag">
            {hasPosts
              ? `${posts.length} ${posts.length === 1 ? 'post' : 'posts'}`
              : 'awaiting first transmission'}
          </span>
          <span className="blog-tag blog-tag--live">live</span>
        </div>
      </header>

      {hasPosts ? (
        <ol className="blog-list">
          {posts.map((post, i) => {
            const num = String(i + 1).padStart(2, '0');
            const summary = shortSummary(post);
            return (
              <li key={post.id} className="blog-card">
                <Link href={`/blog/${post.slug}`} className="blog-card-link">
                  <span className="blog-card-index">#{num}</span>
                  <div className="blog-card-body">
                    <div className="blog-card-meta">
                      <time dateTime={post.published_at}>
                        {formatDate(post.published_at)}
                      </time>
                      {post.reading_time ? (
                        <>
                          <span className="blog-card-dot" aria-hidden>
                            ·
                          </span>
                          <span>{post.reading_time} min read</span>
                        </>
                      ) : null}
                    </div>
                    <h2 className="blog-card-title">{post.title}</h2>
                    {summary ? <p className="blog-card-summary">{summary}</p> : null}
                    <span className="blog-card-cta">
                      read transmission
                      <svg viewBox="0 0 24 24" aria-hidden>
                        <path
                          d="M5 12h14M13 6l6 6-6 6"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </div>
                  {post.featured_image ? (
                    <span
                      className="blog-card-image"
                      style={{ backgroundImage: `url(${post.featured_image})` }}
                      aria-hidden
                    />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="blog-empty">
          <span className="blog-empty-cursor">_</span>
          <p>no transmissions yet — signal acquisition in progress.</p>
        </div>
      )}
    </BlogShell>
  );
}
