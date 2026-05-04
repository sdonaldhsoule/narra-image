"use client";

/* eslint-disable @next/next/no-img-element */

// 右侧历史图片栏：自动向上滚动，悬停暂停，点击复用 zoomedImage 放大遮罩。
// 仅桌面端展示（hidden md:flex），移动端不出现。
import { getThumbUrl } from "@/lib/image-url";

type HistoryRailItem = {
  id: string;
  url: string;
  createdAt: string;
};

type HistoryRailProps = {
  images: HistoryRailItem[];
  onPickImage: (url: string) => void;
};

export function HistoryRail({ images, onPickImage }: HistoryRailProps) {
  return (
    <aside className="hidden md:flex h-full w-60 shrink-0 flex-col border-l border-[var(--line)] bg-[var(--surface)] overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
        <h3 className="text-xs font-medium text-[var(--ink)]">历史图片</h3>
        <span className="text-[10px] text-[var(--ink-soft)]/70">悬停暂停</span>
      </div>
      {images.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-4 text-center">
          <p className="text-xs leading-relaxed text-[var(--ink-soft)]/70">
            还没有作品
            <br />
            先生成一张吧
          </p>
        </div>
      ) : (
        <div
          className="history-rail flex-1 overflow-hidden"
          style={
            {
              "--history-rail-duration": `${Math.max(40, images.length * 3)}s`,
            } as React.CSSProperties
          }
        >
          <div className="history-rail-track flex flex-col gap-2 px-3 py-3">
            {[...images, ...images].map((image, index) => (
              <button
                key={`${image.id}_${index}`}
                type="button"
                onClick={() => onPickImage(image.url)}
                className="group block w-full overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface-strong)]/40 transition hover:border-[var(--accent)]"
                title="点击放大查看"
              >
                <img
                  src={getThumbUrl(image.url, 256)}
                  alt="历史图片"
                  loading="lazy"
                  decoding="async"
                  className="block h-auto w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
