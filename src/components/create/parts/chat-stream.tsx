"use client";

// 对话流：空状态提示 + 历史 generation 气泡列表。
import { WandSparkles } from "lucide-react";
import { forwardRef } from "react";

import { GenerationBubble } from "./generation-bubble";
import type { GenerationItem } from "../types";

type ChatStreamProps = {
  generations: GenerationItem[];
  onZoom: (url: string) => void;
  onDownload: (url: string) => void;
  onUseForEdit: (url: string) => void;
  onRetry?: (generation: GenerationItem) => void;
  onCancel?: (generation: GenerationItem) => void;
};

export const ChatStream = forwardRef<HTMLDivElement, ChatStreamProps>(function ChatStream(
  { generations, onZoom, onDownload, onUseForEdit, onRetry, onCancel },
  ref,
) {
  return (
    <div
      ref={ref}
      className="flex-1 overflow-y-auto px-4 pb-40 md:px-8 scroll-smooth"
      style={{ scrollbarWidth: "thin" }}
    >
      <div className="mx-auto max-w-3xl space-y-8">
        {generations.length === 0 ? (
          <div className="flex h-[40vh] flex-col items-center justify-center text-center">
            <div className="mb-6 rounded-full bg-gradient-to-br from-[var(--accent)]/20 to-purple-500/20 p-5 ring-1 ring-[var(--line)]">
              <WandSparkles className="size-8 text-[var(--accent)]" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--ink)]">你好，你想创作什么？</h2>
            <p className="mt-2 text-[var(--ink-soft)] max-w-md">
              在下方输入描述开始生成图片，或者直接粘贴一张图片进入图生图模式。
            </p>
          </div>
        ) : (
          generations.map((generation) => (
            <GenerationBubble
              key={generation.id}
              generation={generation}
              onZoom={onZoom}
              onDownload={onDownload}
              onUseForEdit={onUseForEdit}
              onRetry={onRetry}
              onCancel={onCancel}
            />
          ))
        )}
      </div>
    </div>
  );
});
