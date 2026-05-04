"use client";

// 图片放大遮罩。完全独立的展示组件，无内部状态（除动画）。
import { Download, ImagePlus, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";

type ImageZoomModalProps = {
  src: string | null;
  onClose: () => void;
  onDownload: (url: string) => void;
  onUseForEdit: (url: string) => void;
};

export function ImageZoomModal({ src, onClose, onDownload, onUseForEdit }: ImageZoomModalProps) {
  // 监听 Escape 关闭，弥补原实现只能点背景关闭的可访问性短板。
  useEffect(() => {
    if (!src) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [src, onClose]);

  return (
    <AnimatePresence>
      {src && (
        <motion.div
          key="zoomed-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          onClick={onClose}
        >
          <button
            type="button"
            className="absolute right-6 top-6 cursor-pointer text-white/70 transition hover:text-white"
            onClick={onClose}
            aria-label="关闭"
          >
            <X className="size-8" />
          </button>
          <motion.img
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            src={src}
            alt="放大查看"
            decoding="async"
            className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-8 flex items-center gap-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownload(src);
              }}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white/20 px-6 py-3 text-sm font-medium text-white shadow-lg backdrop-blur-md transition-all duration-200 ease-out hover:bg-[var(--accent)] hover:shadow-xl"
            >
              <Download className="size-4" />
              保存高清原图
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUseForEdit(src);
                onClose();
              }}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-black shadow-lg transition-all duration-200 ease-out hover:bg-[var(--accent)] hover:text-white hover:shadow-xl"
            >
              <ImagePlus className="size-4" />
              加入编辑
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
