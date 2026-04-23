"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type InviteClaimBatch = {
  id: string;
  remainingCount: number;
  title: string | null;
  totalCount: number;
};

export function InviteClaimBoard({
  batches,
}: {
  batches: InviteClaimBatch[];
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {batches.map((batch) => (
        <InviteClaimCard key={batch.id} batch={batch} />
      ))}
    </div>
  );
}

function InviteClaimCard({
  batch,
}: {
  batch: InviteClaimBatch;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleClaim() {
    setError(null);

    const response = await fetch(`/api/invites/batches/${batch.id}/claim`, {
      method: "POST",
    });
    const result = (await response.json()) as {
      data?: {
        registerUrl: string;
      };
      error?: string;
    };

    if (!response.ok || !result.data?.registerUrl) {
      setError(result.error || "领取失败，请稍后再试");
      return;
    }

    startTransition(() => {
      router.push(result.data!.registerUrl);
    });
  }

  return (
    <article className="studio-card rounded-[2rem] p-5">
      <p className="text-xs uppercase tracking-[0.3em] text-[var(--ink-soft)]">
        Public Claim
      </p>
      <h2 className="mt-3 text-2xl font-semibold text-[var(--ink)]">
        {batch.title || "未命名邀请码批次"}
      </h2>
      <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
        公开页不会直接展示邀请码明文，点击领取后系统会分配一个可注册的邀请码。
      </p>

      <div className="mt-5 flex items-center gap-3 text-sm text-[var(--ink-soft)]">
        <span className="rounded-full bg-[var(--surface-strong)] px-3 py-1">
          总量 {batch.totalCount}
        </span>
        <span className="rounded-full bg-[var(--surface-strong)] px-3 py-1">
          剩余 {batch.remainingCount}
        </span>
      </div>

      <button
        type="button"
        disabled={isPending || batch.remainingCount <= 0}
        onClick={() => startTransition(handleClaim)}
        className="mt-6 rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[var(--accent)] disabled:opacity-60"
      >
        {isPending ? "领取中..." : batch.remainingCount > 0 ? "领取邀请码" : "已领完"}
      </button>

      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
    </article>
  );
}
