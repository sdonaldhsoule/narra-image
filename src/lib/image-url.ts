/**
 * 把远程原图 URL 包装成 Next.js Image Optimization 端点 URL。
 *
 * 调用 /_next/image 时，Next.js 会按 width 输出 AVIF/WebP，并按
 * Cache-Control 缓存。原图（OAuth 头像、S3 上传）原样下发会非常浪费带宽。
 *
 * @param src     原图 URL；data:/blob: 直接原样返回
 * @param width   目标宽度，必须命中 next.config 的 imageSizes/deviceSizes
 * @param quality 0-100，默认 75
 */
export function getThumbUrl(
  src: string | null | undefined,
  width: number,
  quality = 75,
): string {
  if (!src) return "";
  // 本地预览（用户刚选的文件）和 base64 不需要走优化
  if (src.startsWith("data:") || src.startsWith("blob:")) return src;
  // 已经是 /_next/image 的不要重复包
  if (src.startsWith("/_next/image")) return src;

  const params = new URLSearchParams({
    url: src,
    w: String(width),
    q: String(quality),
  });
  return `/_next/image?${params.toString()}`;
}

/**
 * 生成响应式 srcset 字符串，配合 <img sizes> 让浏览器根据视口和 DPR
 * 自己挑合适的档位，避免移动端高 DPR 屏拉糊、桌面大屏拉浪费。
 *
 * @param widths 必须命中 next.config 的 imageSizes/deviceSizes，否则 Next 会拒绝
 */
export function getThumbSrcSet(
  src: string | null | undefined,
  widths: number[],
  quality = 75,
): string {
  if (!src) return "";
  if (src.startsWith("data:") || src.startsWith("blob:")) return "";
  return widths.map((w) => `${getThumbUrl(src, w, quality)} ${w}w`).join(", ");
}
