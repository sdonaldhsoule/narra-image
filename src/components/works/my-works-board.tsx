"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Download, Expand, FileText, Loader2, Trash2 } from "lucide-react";
import { motion } from "motion/react";

import type { SerializedWork } from "@/lib/prisma-mappers";
import { downloadImage } from "@/components/works/download-image";
import { ImageLightbox } from "@/components/works/image-lightbox";
import { PromptModal } from "@/components/works/prompt-modal";
import { Alert } from "@/components/ui/alert";
import { getThumbUrl } from "@/lib/image-url";
import {
  WorkShowcaseControls,
  WorkStatusBadge,
} from "@/components/works/work-showcase-controls";

type MyWorksBoardProps = {
  initialItems: SerializedWork[];
  initialHasMore: boolean;
  initialCursor: string | null;
};

type LoadMoreResponse = {
  data?: {
    hasMore: boolean;
    items: SerializedWork[];
    nextCursor: string | null;
  };
  error?: string;
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "numeric",
  }).format(new Date(value));
}

export function MyWorksBoard({
  initialItems,
  initialHasMore,
  initialCursor,
}: MyWorksBoardProps) {
  const router = useRouter();
  const [items, setItems] = useState<SerializedWork[]>(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  const [zoomedWork, setZoomedWork] = useState<SerializedWork | null>(null);
  const [promptWork, setPromptWork] = useState<SerializedWork | null>(null);
  const [deletingWork, setDeletingWork] = useState<SerializedWork | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleLoadMore() {
    if (!hasMore || !cursor || isLoadingMore) return;
    setLoadMoreError(null);
    setIsLoadingMore(true);
    try {
      const response = await fetch(
        `/api/me/works?cursor=${encodeURIComponent(cursor)}&limit=24`,
      );
      const result = (await response.json().catch(() => ({}))) as LoadMoreResponse;
      if (!response.ok || !result.data) {
        setLoadMoreError(result.error || "加载更多失败，请稍后再试");
        return;
      }
      setItems((prev) => [...prev, ...result.data!.items]);
      setHasMore(result.data.hasMore);
      setCursor(result.data.nextCursor);
    } catch (err) {
      setLoadMoreError(
        err instanceof Error ? err.message : "加载更多失败，请稍后再试",
      );
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deletingWork) return;
    setDeleteError(null);
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/me/works/${deletingWork.id}`, {
        method: "DELETE",
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok) {
        setDeleteError(result.error || "删除失败，请稍后再试");
        return;
      }
      // 客户端立即移除该项，避免等 server refresh 的视觉延迟
      setItems((prev) => prev.filter((item) => item.id !== deletingWork.id));
      setDeletingWork(null);
      // 触发顶部 counts 卡片重新计算
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="studio-card rounded-[2rem] border border-dashed border-[var(--line)] p-10 text-center">
        <h2 className="text-xl font-semibold text-[var(--ink)]">还没有作品</h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--ink-soft)]">
          先去创作台生成图片。生成成功后，每一张图都会自动进入这里，默认仅自己可见。
        </p>
        <div className="mt-6">
          <Link
            href="/create"
            className="rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[var(--accent)]"
          >
            去生成作品
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((work, index) => (
          <motion.article
            key={work.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.28,
              ease: "easeOut",
              delay: Math.min((index % 24) * 0.025, 0.3),
            }}
            className="studio-card flex flex-col rounded-[1.6rem] p-4"
          >
            <button
              type="button"
              onClick={() => setZoomedWork(work)}
              className="group relative overflow-hidden rounded-[1.25rem] border border-[var(--line)] bg-[var(--surface-strong)]/40 cursor-pointer"
            >
              <img
                src={getThumbUrl(work.url, 640)}
                alt="作品预览"
                loading="lazy"
                decoding="async"
                className="aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/20" />
              <span className="absolute right-3 top-3 rounded-full bg-black/55 p-2 text-white opacity-0 transition group-hover:opacity-100">
                <Expand className="size-4" />
              </span>
            </button>

            <div className="mt-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-[var(--ink-soft)]">创建于 {formatTime(work.createdAt)}</p>
                <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-[var(--ink)]">
                  {work.prompt}
                </p>
              </div>
              <WorkStatusBadge status={work.showcaseStatus} />
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-[var(--ink-soft)]">
              <span className="rounded-full bg-[var(--surface-strong)] px-2.5 py-1">{work.model}</span>
              <span className="rounded-full bg-[var(--surface-strong)] px-2.5 py-1">{work.size}</span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={`/works/${work.id}`}
                className="rounded-full bg-[var(--ink)] px-3 py-2 text-xs font-medium text-white transition hover:bg-[var(--accent)]"
              >
                查看详情
              </Link>
              <button
                type="button"
                onClick={() => setPromptWork(work)}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] px-3 py-2 text-xs text-[var(--ink)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] cursor-pointer"
              >
                <FileText className="size-3.5" />
                提示词
              </button>
              <button
                type="button"
                onClick={() => void downloadImage(work.url)}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] px-3 py-2 text-xs text-[var(--ink)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] cursor-pointer"
              >
                <Download className="size-3.5" />
                下载
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeleteError(null);
                  setDeletingWork(work);
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 px-3 py-2 text-xs text-rose-600 transition hover:border-rose-400 hover:text-rose-700 cursor-pointer"
              >
                <Trash2 className="size-3.5" />
                删除
              </button>
            </div>

            <div className="mt-3">
              <WorkShowcaseControls work={work} compact />
            </div>
          </motion.article>
        ))}

        {/* 加载中骨架占位（只在追加加载时出现，首屏由 SSR 直出真实内容） */}
        {isLoadingMore &&
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`skeleton_${index}`}
              className="studio-card flex flex-col rounded-[1.6rem] p-4"
              aria-hidden
            >
              <div className="aspect-[3/4] w-full animate-pulse rounded-[1.25rem] bg-[var(--surface-strong)]/60" />
              <div className="mt-3 space-y-2">
                <div className="h-3 w-1/3 animate-pulse rounded-full bg-[var(--surface-strong)]/60" />
                <div className="h-3 w-full animate-pulse rounded-full bg-[var(--surface-strong)]/60" />
                <div className="h-3 w-4/5 animate-pulse rounded-full bg-[var(--surface-strong)]/60" />
              </div>
            </div>
          ))}
      </div>

      {/* 加载更多按钮 / 错误重试 / 触底提示 */}
      {hasMore ? (
        <div className="mt-8 flex flex-col items-center gap-3">
          {loadMoreError ? (
            <Alert variant="error" className="rounded-full px-4 py-2 text-xs">
              {loadMoreError}
            </Alert>
          ) : null}
          <button
            type="button"
            onClick={() => void handleLoadMore()}
            disabled={isLoadingMore}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-medium text-white shadow-md transition hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                加载中
              </>
            ) : loadMoreError ? (
              "重试"
            ) : (
              "加载更多"
            )}
          </button>
        </div>
      ) : items.length >= 24 ? (
        <div className="mt-8 text-center text-xs text-[var(--ink-soft)]/70">
          没有更多作品了
        </div>
      ) : null}

      {zoomedWork ? (
        <ImageLightbox src={zoomedWork.url} onClose={() => setZoomedWork(null)}>
          <button
            type="button"
            onClick={() => void downloadImage(zoomedWork.url)}
            className="rounded-full bg-white/20 px-5 py-3 text-sm font-medium text-white backdrop-blur-md transition hover:bg-[var(--accent)] cursor-pointer"
          >
            下载这张图
          </button>
        </ImageLightbox>
      ) : null}

      {promptWork ? (
        <PromptModal
          prompt={promptWork.prompt}
          negativePrompt={promptWork.negativePrompt}
          onClose={() => setPromptWork(null)}
        />
      ) : null}

      {deletingWork ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => {
            if (!isDeleting) setDeletingWork(null);
          }}
        >
          <div
            className="studio-card w-full max-w-md rounded-[1.8rem] p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-[var(--ink)]">删除作品</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">
              删除后这张图片将不再出现在你的作品列表中，且无法恢复。是否继续？
            </p>
            {deleteError ? (
              <div className="mt-3">
                <Alert variant="error">{deleteError}</Alert>
              </div>
            ) : null}
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingWork(null)}
                className="rounded-full border border-[var(--line)] px-4 py-2 text-sm text-[var(--ink-soft)] disabled:opacity-60 cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => void handleConfirmDelete()}
                className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700 disabled:opacity-60 cursor-pointer"
              >
                {isDeleting ? <Loader2 className="size-4 animate-spin" /> : null}
                {isDeleting ? "删除中" : "确认删除"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
