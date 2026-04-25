"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useEffectEvent, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, User } from "lucide-react";

type Work = {
  authorAvatar: string | null;
  authorName: string;
  featuredAt: string | null;
  id: string;
  image: string;
  prompt: string;
  title: string;
};

type FeaturedResponse = {
  hasMore: boolean;
  items: Work[];
  nextCursor: string | null;
};

type FeaturedGalleryProps = {
  initialHasMore?: boolean;
  initialNextCursor?: string | null;
  works: Work[];
};

function mergeUniqueWorks(current: Work[], incoming: Work[]) {
  const seen = new Set(current.map((work) => work.id));
  const next = [...current];

  for (const work of incoming) {
    if (seen.has(work.id)) {
      continue;
    }
    seen.add(work.id);
    next.push(work);
    if (next.length >= 100) {
      break;
    }
  }

  return next;
}

export function FeaturedGallery({
  initialHasMore = false,
  initialNextCursor = null,
  works,
}: FeaturedGalleryProps) {
  const [items, setItems] = useState(() => works);
  const [hasMore, setHasMore] = useState(() => initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState(() => initialNextCursor);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useEffectEvent(async () => {
    if (isLoading || !hasMore || !nextCursor || items.length >= 100) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/works/featured?cursor=${encodeURIComponent(nextCursor)}&limit=24`,
      );
      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as FeaturedResponse;
      setItems((current) => mergeUniqueWorks(current, data.items));
      setHasMore(data.hasMore);
      setNextCursor(data.nextCursor);
    } finally {
      setIsLoading(false);
    }
  });

  useEffect(() => {
    if (!hasMore || !sentinelRef.current || items.length >= 100) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        void loadMore();
      }
    });

    observer.observe(sentinelRef.current);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, items.length]);

  return (
    <>
      <div className="columns-1 space-y-5 gap-5 sm:columns-2 lg:columns-3 xl:columns-4">
        {items.map((work) => (
          <Link
            key={work.id}
            href={`/works/${work.id}`}
            className="studio-card group relative block break-inside-avoid overflow-hidden rounded-[1.5rem]"
          >
            <img
              src={work.image}
              alt={work.title}
              className="w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)]/85 via-[var(--ink)]/20 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-4 p-5">
              <div className="min-w-0 flex-1">
                {/* 作者信息 */}
                <div className="mb-2 flex items-center gap-2">
                  <div className="size-6 shrink-0 overflow-hidden rounded-full border border-white/30 bg-white/15">
                    {work.authorAvatar ? (
                      <img
                        src={work.authorAvatar}
                        alt={work.authorName}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        <User className="size-3.5 text-white/80" />
                      </div>
                    )}
                  </div>
                  <span className="truncate text-xs font-medium text-white/90">
                    {work.authorName}
                  </span>
                </div>
                <h3 className="truncate font-semibold text-white">{work.title}</h3>
                <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-white/80">
                  {work.prompt}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-white/15 p-2.5 text-white backdrop-blur-sm transition group-hover:-translate-y-0.5 group-hover:bg-white/25">
                <ArrowUpRight className="size-5" />
              </span>
            </div>
          </Link>
        ))}
      </div>

      {hasMore && items.length < 100 ? (
        <div ref={sentinelRef} aria-hidden="true" className="h-10 w-full" />
      ) : null}

      {isLoading ? (
        <p className="mt-6 text-center text-sm text-[var(--ink-soft)]">正在加载更多精选...</p>
      ) : null}
    </>
  );
}
