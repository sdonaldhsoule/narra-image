/* eslint-disable @next/next/no-img-element */

"use client";

import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Sparkles, WandSparkles } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type ViewerUser = {
  credits: number;
  role: "user" | "admin";
} | null;

type GenerationItem = {
  count: number;
  createdAt: string;
  creditsSpent: number;
  id: string;
  images: Array<{
    id: string;
    url: string;
  }>;
  model: string;
  negativePrompt?: string | null;
  prompt: string;
  providerMode: "built_in" | "custom";
  size: string;
  status: "pending" | "succeeded" | "failed";
};

type SavedProvider = {
  baseUrl: string;
  label?: string | null;
  model: string;
} | null;

type GeneratorStudioProps = {
  compact?: boolean;
  currentUser: ViewerUser;
  initialGenerations?: GenerationItem[];
  initialSavedProvider?: SavedProvider;
};

const stylePresets = [
  "电影级海报",
  "杂志封面",
  "霓虹街拍",
  "手作拼贴",
  "柔光人像",
  "未来建筑",
];

export function GeneratorStudio({
  compact = false,
  currentUser,
  initialGenerations = [],
  initialSavedProvider = null,
}: GeneratorStudioProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isFetchingModels, startFetchingModels] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [modelProbeError, setModelProbeError] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [model, setModel] = useState(initialSavedProvider?.model || "gpt-image-1");
  const [size, setSize] = useState<"1024x1024" | "1024x1536" | "1536x1024">(
    "1024x1024",
  );
  const [count, setCount] = useState(1);
  const [providerMode, setProviderMode] = useState<"built_in" | "custom">(
    "built_in",
  );
  const [customBaseUrl, setCustomBaseUrl] = useState(
    initialSavedProvider?.baseUrl || "",
  );
  const [customApiKey, setCustomApiKey] = useState("");
  const [rememberProvider, setRememberProvider] = useState(false);
  const [generations, setGenerations] = useState(initialGenerations);
  const [credits, setCredits] = useState(currentUser?.credits ?? 0);

  const latestGeneration = generations[0] ?? null;
  const gallery = latestGeneration?.images ?? [];

  const sizeOptions = useMemo(
    () => [
      { label: "方形", value: "1024x1024" },
      { label: "竖版", value: "1024x1536" },
      { label: "横版", value: "1536x1024" },
    ],
    [],
  );

  async function handleGenerate() {
    if (!currentUser) {
      router.push("/login");
      return;
    }

    setError(null);

    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        count,
        customProvider:
          providerMode === "custom"
            ? {
                apiKey: customApiKey,
                baseUrl: customBaseUrl,
                label: "我的渠道",
                model,
                remember: rememberProvider,
              }
            : null,
        model,
        negativePrompt: negativePrompt || null,
        prompt,
        providerMode,
        size,
      }),
    });

    const result = (await response.json()) as {
      data?: {
        generation: GenerationItem;
      };
      error?: string;
    };

    if (!response.ok) {
      setError(result.error || "生成失败，请稍后再试");
      return;
    }

    const generation = result.data?.generation;
    if (!generation) {
      setError("服务端没有返回图片");
      return;
    }

    setGenerations((current) => [generation, ...current]);
    if (generation.providerMode === "built_in") {
      setCredits((current) => Math.max(0, current - generation.creditsSpent));
    }
  }

  async function handleProbeModels() {
    setModelProbeError(null);

    const response = await fetch("/api/provider-models/probe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        apiKey: customApiKey || null,
        baseUrl: customBaseUrl,
      }),
    });

    const result = (await response.json()) as {
      data?: {
        models: Array<{
          id: string;
          imageLikely: boolean;
        }>;
      };
      error?: string;
    };

    if (!response.ok) {
      setModelProbeError(result.error || "拉取模型失败");
      return;
    }

    const models = result.data?.models ?? [];
    setAvailableModels(models.map((item) => item.id));
    if (models[0]?.id) {
      setModel(models[0].id);
    }
  }

  function applyPreset(preset: string) {
    setPrompt((current) => (current ? `${current}，${preset}` : preset));
  }

  return (
    <section
      className={`grid gap-6 ${compact ? "xl:grid-cols-[1.18fr_0.82fr]" : "xl:grid-cols-[1fr_0.96fr]"}`}
    >
      <div className="studio-card noise-overlay relative overflow-hidden rounded-[2rem] p-6 md:p-8">
        <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-50" />
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.32em] text-[var(--ink-soft)]">
              Prompt Director
            </p>
            <h2 className="editorial-title text-4xl font-semibold md:text-5xl">
              把一句灵感，变成一组能发出去的图。
            </h2>
          </div>
          <div className="rounded-3xl border border-[var(--line)] bg-white/70 px-4 py-3 text-right">
            <div className="text-xs uppercase tracking-[0.24em] text-[var(--ink-soft)]">
              Credits
            </div>
            <div className="mt-1 text-2xl font-semibold text-[var(--accent)]">
              {currentUser ? credits : "--"}
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="例如：一位穿银色风衣的亚洲模特站在雨后的城市巷口，胶片颗粒感，杂志封面光影。"
            className="min-h-40 rounded-[1.6rem] border border-[var(--line)] bg-white/72 px-5 py-4 text-base outline-none transition focus:border-[var(--accent)]"
          />

          <div className="flex flex-wrap gap-2">
            {stylePresets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => applyPreset(preset)}
                className="rounded-full border border-[var(--line)] bg-white/70 px-3 py-1.5 text-sm text-[var(--ink-soft)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm text-[var(--ink-soft)]">模型</span>
              <div className="grid gap-2">
                <div className="flex gap-2">
                  <input
                    value={model}
                    onChange={(event) => setModel(event.target.value)}
                    className="flex-1 rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                  />
                  {providerMode === "custom" ? (
                    <button
                      type="button"
                      onClick={() => startFetchingModels(handleProbeModels)}
                      disabled={isFetchingModels || !customBaseUrl}
                      className="rounded-full border border-[var(--line)] px-4 py-3 text-sm text-[var(--ink-soft)] disabled:opacity-60"
                    >
                      {isFetchingModels ? "拉取中..." : "拉模型"}
                    </button>
                  ) : null}
                </div>
                {availableModels.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {availableModels.slice(0, 10).map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setModel(item)}
                        className={`rounded-full px-3 py-1.5 text-xs ${
                          model === item
                            ? "bg-[var(--ink)] text-white"
                            : "border border-[var(--line)] text-[var(--ink-soft)]"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                ) : null}
                {modelProbeError ? (
                  <p className="text-sm text-amber-700">{modelProbeError}</p>
                ) : null}
              </div>
            </label>

            <label className="grid gap-2">
              <span className="text-sm text-[var(--ink-soft)]">生成张数</span>
              <select
                value={count}
                onChange={(event) => setCount(Number(event.target.value))}
                className="rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-3 outline-none transition focus:border-[var(--accent)]"
              >
                {[1, 2, 3, 4].map((value) => (
                  <option key={value} value={value}>
                    {value} 张
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex flex-wrap gap-2">
              {sizeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSize(option.value as typeof size)}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    size === option.value
                      ? "bg-[var(--ink)] text-white"
                      : "border border-[var(--line)] bg-white/70 text-[var(--ink-soft)]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-start gap-2 rounded-2xl border border-[var(--line)] bg-white/65 p-1">
              <button
                type="button"
                onClick={() => setProviderMode("built_in")}
                className={`flex-1 rounded-2xl px-4 py-2 text-sm ${
                  providerMode === "built_in"
                    ? "bg-[var(--ink)] text-white"
                    : "text-[var(--ink-soft)]"
                }`}
              >
                内置渠道
              </button>
              <button
                type="button"
                onClick={() => setProviderMode("custom")}
                className={`flex-1 rounded-2xl px-4 py-2 text-sm ${
                  providerMode === "custom"
                    ? "bg-[var(--ink)] text-white"
                    : "text-[var(--ink-soft)]"
                }`}
              >
                自填渠道
              </button>
            </div>
          </div>

          <details className="rounded-[1.5rem] border border-[var(--line)] bg-white/60 px-5 py-4">
            <summary className="cursor-pointer list-none text-sm font-medium text-[var(--ink)]">
              高级选项
            </summary>
            <div className="mt-4 grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm text-[var(--ink-soft)]">负向提示词</span>
                <textarea
                  value={negativePrompt}
                  onChange={(event) => setNegativePrompt(event.target.value)}
                  placeholder="比如：低清晰度、畸形手部、过曝"
                  className="min-h-24 rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                />
              </label>

              {providerMode === "custom" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 md:col-span-2">
                    <span className="text-sm text-[var(--ink-soft)]">Base URL</span>
                    <input
                      value={customBaseUrl}
                      onChange={(event) => setCustomBaseUrl(event.target.value)}
                      placeholder="https://your-gateway.example.com/v1"
                      className="rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                    />
                  </label>
                  <label className="grid gap-2 md:col-span-2">
                    <span className="text-sm text-[var(--ink-soft)]">API Key</span>
                    <input
                      value={customApiKey}
                      onChange={(event) => setCustomApiKey(event.target.value)}
                      placeholder="sk-..."
                      className="rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                    />
                  </label>
                  <label className="flex items-center gap-3 text-sm text-[var(--ink-soft)]">
                    <input
                      type="checkbox"
                      checked={rememberProvider}
                      onChange={(event) => setRememberProvider(event.target.checked)}
                    />
                    记住我的自填渠道配置
                  </label>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white/50 px-4 py-3 text-sm text-[var(--ink-soft)]">
                  当前使用站点内置渠道，每次成功生成默认扣除 5 积分。
                </div>
              )}
            </div>
          </details>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              {error}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => startTransition(handleGenerate)}
            disabled={isPending || !prompt.trim()}
            className="flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3.5 text-sm font-medium text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? <Sparkles className="size-4 animate-spin" /> : <WandSparkles className="size-4" />}
            {currentUser ? "开始生成" : "登录后生成"}
          </button>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="studio-card overflow-hidden rounded-[2rem] p-4">
          <div className="mb-4 flex items-center justify-between px-2">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--ink-soft)]">
                Latest Output
              </p>
              <h3 className="mt-1 text-lg font-medium">刚刚生成的结果</h3>
            </div>
            {latestGeneration ? (
              <div className="text-right text-xs text-[var(--ink-soft)]">
                <div>{latestGeneration.model}</div>
                <div>{latestGeneration.size}</div>
              </div>
            ) : null}
          </div>

          {gallery.length > 0 ? (
            <div className={`grid gap-3 ${gallery.length > 1 ? "sm:grid-cols-2" : ""}`}>
              {gallery.map((image) => (
                <div
                  key={image.id}
                  className="overflow-hidden rounded-[1.6rem] border border-[var(--line)] bg-white/70"
                >
                  <img
                    src={image.url}
                    alt="生成结果"
                    className="aspect-[4/5] h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.7rem] border border-dashed border-[var(--line)] bg-white/45 px-6 py-16 text-center text-sm text-[var(--ink-soft)]">
              你的结果会出现在这里。首页适合快速开做，创作页更适合连续调参。
            </div>
          )}
        </div>

        <div className="studio-card rounded-[2rem] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--ink-soft)]">
                History
              </p>
              <h3 className="mt-1 text-lg font-medium">最近生成记录</h3>
            </div>
          </div>

          <div className="grid gap-3">
            {generations.length > 0 ? (
              generations.slice(0, compact ? 3 : 6).map((generation) => (
                <div
                  key={generation.id}
                  className="rounded-[1.4rem] border border-[var(--line)] bg-white/68 p-4"
                >
                  <div className="mb-2 flex items-center justify-between gap-3 text-xs text-[var(--ink-soft)]">
                    <span>{generation.providerMode === "built_in" ? "内置渠道" : "自填渠道"}</span>
                    <span>
                      {formatDistanceToNow(new Date(generation.createdAt), {
                        addSuffix: true,
                        locale: zhCN,
                      })}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-sm text-[var(--ink)]">{generation.prompt}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-[var(--ink-soft)]">
                    <span>{generation.model}</span>
                    <span>{generation.creditsSpent} 积分</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[1.4rem] border border-dashed border-[var(--line)] bg-white/45 px-4 py-8 text-sm text-[var(--ink-soft)]">
                还没有生成记录。建议先试一个“电影级海报”风格。
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
