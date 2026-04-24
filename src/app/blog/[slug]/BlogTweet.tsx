'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface Props {
  tweetUrl: string;
  title?: string;
}

declare global {
  interface Window {
    twttr?: { widgets?: { load?: (el?: HTMLElement) => void } };
  }
}

/**
 * Loads Twitter's widgets.js once per page and asks it to render the embed
 * inside this component's container. If the script is blocked or slow, the
 * <blockquote> falls back to a styled link.
 */
export function BlogTweet({ tweetUrl, title }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  const loadWidget = useCallback(() => {
    if (window.twttr?.widgets?.load && containerRef.current) {
      window.twttr.widgets.load(containerRef.current);
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (window.twttr?.widgets?.load) {
      loadWidget();
      return;
    }

    const existing = document.getElementById('twitter-wjs') as HTMLScriptElement | null;
    if (existing) {
      // Script tag exists but widget API may still be loading.
      const interval = window.setInterval(() => {
        if (window.twttr?.widgets?.load) {
          window.clearInterval(interval);
          loadWidget();
        }
      }, 200);
      return () => window.clearInterval(interval);
    }

    const script = document.createElement('script');
    script.id = 'twitter-wjs';
    script.src = 'https://platform.twitter.com/widgets.js';
    script.async = true;
    script.onload = () => window.setTimeout(loadWidget, 100);
    document.head.appendChild(script);
  }, [loadWidget]);

  return (
    <figure className="blog-embed blog-embed--tweet">
      {title ? <figcaption>{title}</figcaption> : null}
      <div className="blog-tweet" ref={containerRef}>
        <blockquote
          className="twitter-tweet"
          data-theme="dark"
          data-dnt="true"
          data-cards="hidden"
        >
          <a href={tweetUrl} target="_blank" rel="noreferrer">
            View tweet →
          </a>
        </blockquote>
      </div>
      {!loaded ? (
        <noscript>
          <a href={tweetUrl} target="_blank" rel="noreferrer" className="blog-embed-link">
            View tweet on X →
          </a>
        </noscript>
      ) : null}
    </figure>
  );
}
