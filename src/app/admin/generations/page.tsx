/* eslint-disable @next/next/no-img-element */

import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { requireAdminRecord } from "@/lib/server/current-user";
import { SiteHeader } from "@/components/marketing/site-header";
import { AdminNav } from "@/components/admin/admin-nav";
import { FeatureToggleButton } from "@/components/admin/admin-actions";
import { serializeUser } from "@/lib/prisma-mappers";

export const dynamic = "force-dynamic";

export default async function AdminGenerationsPage() {
  let admin;
  try {
    admin = await requireAdminRecord();
  } catch {
    redirect("/login");
  }

  const jobs = await db.generationJob.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      images: {
        orderBy: { createdAt: "asc" },
      },
      user: {
        select: {
          email: true,
        },
      },
    },
    take: 36,
  });

  return (
    <main className="pb-16">
      <SiteHeader currentUser={serializeUser(admin)} />
      <section className="mx-auto grid max-w-7xl gap-6 px-5 pt-6 md:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-[var(--ink-soft)]">
              Generations
            </p>
            <h1 className="editorial-title mt-3 text-5xl font-semibold">
              你需要看的不是原始日志，而是用户到底生成了什么。
            </h1>
          </div>
          <AdminNav currentPath="/admin/generations" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => (
            <article key={job.id} className="studio-card overflow-hidden rounded-[2rem]">
              {job.images[0] ? (
                <img src={job.images[0].url} alt={job.prompt} className="aspect-[4/5] w-full object-cover" />
              ) : (
                <div className="flex aspect-[4/5] items-center justify-center bg-white/40 text-sm text-[var(--ink-soft)]">
                  暂无图片
                </div>
              )}
              <div className="grid gap-3 p-5">
                <div className="flex items-center justify-between text-xs text-[var(--ink-soft)]">
                  <span>{job.user.email}</span>
                  <span>{job.providerMode === "BUILT_IN" ? "内置渠道" : "自填渠道"}</span>
                </div>
                <p className="line-clamp-3 text-sm leading-7 text-[var(--ink)]">
                  {job.prompt}
                </p>
                <div className="flex items-center justify-between text-xs text-[var(--ink-soft)]">
                  <span>{job.model}</span>
                  <span>{job.creditsSpent} 积分</span>
                </div>
                <FeatureToggleButton
                  featured={Boolean(job.featuredAt)}
                  generationId={job.id}
                />
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
