"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function InviteCreator() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setError(null);
    const response = await fetch("/api/admin/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });
    const result = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(result.error || "创建失败");
      return;
    }

    setNote("");
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="studio-card rounded-[1.8rem] p-5">
      <h3 className="text-lg font-medium">创建邀请码</h3>
      <p className="mt-1 text-sm text-[var(--ink-soft)]">
        建议为每个邀请码写备注，便于追踪来源。
      </p>
      <div className="mt-4 flex flex-col gap-3 md:flex-row">
        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="备注，例如：首批设计师"
          className="flex-1 rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-3 outline-none"
        />
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(handleCreate)}
          className="rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
        >
          {isPending ? "创建中..." : "生成邀请码"}
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}

export function CreditAdjuster({ userId }: { userId: string }) {
  const router = useRouter();
  const [amount, setAmount] = useState(50);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleAdjust() {
    setError(null);

    const response = await fetch(`/api/admin/users/${userId}/credits`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    const result = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(result.error || "调整失败");
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={amount}
          onChange={(event) => setAmount(Number(event.target.value))}
          className="w-24 rounded-xl border border-[var(--line)] bg-white/70 px-3 py-2 text-sm outline-none"
        />
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(handleAdjust)}
          className="rounded-full border border-[var(--line)] px-3 py-2 text-xs text-[var(--ink-soft)] disabled:opacity-60"
        >
          更新积分
        </button>
      </div>
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </div>
  );
}

export function FeatureToggleButton({
  featured,
  generationId,
}: {
  featured: boolean;
  generationId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleToggle() {
    await fetch(`/api/admin/generations/${generationId}/feature`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured: !featured }),
    });

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(handleToggle)}
      className={`rounded-full px-3 py-2 text-xs font-medium ${
        featured
          ? "bg-[var(--accent)] text-white"
          : "border border-[var(--line)] text-[var(--ink-soft)]"
      }`}
    >
      {isPending ? "处理中..." : featured ? "取消精选" : "加入精选"}
    </button>
  );
}

type BuiltInProviderFormProps = {
  initialConfig: {
    apiKeyConfigured: boolean;
    baseUrl: string;
    creditCost: number;
    model: string;
    name: string;
    source: "database" | "env";
  };
};

export function BuiltInProviderForm({
  initialConfig,
}: BuiltInProviderFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isFetchingModels, startFetchingModels] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [modelError, setModelError] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [baseUrl, setBaseUrl] = useState(initialConfig.baseUrl);
  const [model, setModel] = useState(initialConfig.model);
  const [name, setName] = useState(initialConfig.name);
  const [creditCost, setCreditCost] = useState(initialConfig.creditCost);
  const [apiKey, setApiKey] = useState("");

  async function handleSave() {
    setError(null);
    const response = await fetch("/api/admin/provider-config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey,
        baseUrl,
        creditCost,
        model,
        name,
      }),
    });
    const result = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(result.error || "保存失败");
      return;
    }

    setApiKey("");
    startTransition(() => {
      router.refresh();
    });
  }

  async function handleFetchModels() {
    setModelError(null);
    const response = await fetch("/api/provider-models/probe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey,
        baseUrl,
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
      setModelError(result.error || "拉取模型失败");
      return;
    }

    const models = result.data?.models ?? [];
    setAvailableModels(models.map((item) => item.id));
    if (models[0]?.id) {
      setModel(models[0].id);
    }
  }

  return (
    <div className="studio-card rounded-[1.8rem] p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="text-lg font-medium">内置渠道配置</h3>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            当前来源：{initialConfig.source === "database" ? "后台数据库配置" : "环境变量兜底配置"}
          </p>
        </div>
        <div className="rounded-full border border-[var(--line)] px-4 py-2 text-sm text-[var(--ink-soft)]">
          API Key {initialConfig.apiKeyConfigured ? "已配置" : "未配置"}
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 md:col-span-2">
          <span className="text-sm text-[var(--ink-soft)]">渠道名称</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-3 outline-none"
          />
        </label>
        <label className="grid gap-2 md:col-span-2">
          <span className="text-sm text-[var(--ink-soft)]">Base URL</span>
          <input
            value={baseUrl}
            onChange={(event) => setBaseUrl(event.target.value)}
            placeholder="https://your-gateway.example.com/v1"
            className="rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-3 outline-none"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm text-[var(--ink-soft)]">模型名</span>
          <div className="grid gap-2">
            <div className="flex gap-2">
              <input
                value={model}
                onChange={(event) => setModel(event.target.value)}
                className="flex-1 rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-3 outline-none"
              />
              <button
                type="button"
                onClick={() => startFetchingModels(handleFetchModels)}
                disabled={isFetchingModels}
                className="rounded-full border border-[var(--line)] px-4 py-3 text-sm text-[var(--ink-soft)] disabled:opacity-60"
              >
                {isFetchingModels ? "拉取中..." : "拉取模型"}
              </button>
            </div>
            {availableModels.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {availableModels.slice(0, 12).map((item) => (
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
            {modelError ? (
              <p className="text-sm text-amber-700">{modelError}</p>
            ) : null}
          </div>
        </label>
        <label className="grid gap-2">
          <span className="text-sm text-[var(--ink-soft)]">每次扣分</span>
          <input
            type="number"
            value={creditCost}
            onChange={(event) => setCreditCost(Number(event.target.value))}
            className="rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-3 outline-none"
          />
        </label>
        <label className="grid gap-2 md:col-span-2">
          <span className="text-sm text-[var(--ink-soft)]">
            API Key
            <span className="ml-2 text-xs">留空则保留当前密钥</span>
          </span>
          <input
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder={initialConfig.apiKeyConfigured ? "••••••••" : "请输入新的 API Key"}
            className="rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-3 outline-none"
          />
        </label>
      </div>

      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(handleSave)}
        className="mt-5 rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
      >
        {isPending ? "保存中..." : "保存内置渠道"}
      </button>
    </div>
  );
}
