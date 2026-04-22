/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { GenerationStatus } from "@prisma/client";

import { db } from "@/lib/db";
import { serializeUser } from "@/lib/prisma-mappers";
import { getCurrentUserRecord } from "@/lib/server/current-user";
import { GeneratorStudio } from "@/components/create/generator-studio";
import { SiteHeader } from "@/components/marketing/site-header";

export const dynamic = "force-dynamic";

const fallbackWorks = [
  {
    id: "demo-1",
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
    prompt: "雨后城市、银色风衣、胶片颗粒、时尚封面",
    title: "Raincoat Cover",
  },
  {
    id: "demo-2",
    image:
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80",
    prompt: "暖色落日、时装大片、柔焦、高级妆面",
    title: "Golden Issue",
  },
  {
    id: "demo-3",
    image:
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80",
    prompt: "未来建筑、极简镜面、竖版海报、编辑感",
    title: "Mirror City",
  },
];

export default async function Home() {
  const user = await getCurrentUserRecord();
  const currentUser = user ? serializeUser(user) : null;

  const featuredJobs = await db.generationJob
    .findMany({
      where: {
        featuredAt: {
          not: null,
        },
        status: GenerationStatus.SUCCEEDED,
      },
      include: {
        images: {
          orderBy: { createdAt: "asc" },
          take: 1,
        },
      },
      orderBy: { featuredAt: "desc" },
      take: 6,
    })
    .catch(() => []);

  const works =
    featuredJobs.length > 0
      ? featuredJobs
          .filter((job) => job.images[0])
          .map((job) => ({
            id: job.id,
            image: job.images[0]!.url,
            prompt: job.prompt,
            title: job.model,
          }))
      : fallbackWorks;

  return (
    <main className="pb-20">
      <SiteHeader currentUser={currentUser} />

      <section className="mx-auto grid max-w-7xl gap-8 px-5 pb-8 pt-4 md:px-8">
        <div className="grid gap-6 xl:grid-cols-[0.86fr_1.14fr] xl:items-end">
          <div className="space-y-6">
            <div className="inline-flex rounded-full border border-[var(--line)] bg-white/70 px-4 py-2 text-xs uppercase tracking-[0.3em] text-[var(--ink-soft)]">
              生成器主导 · 潮流作品感
            </div>
            <div className="space-y-4">
              <h1 className="editorial-title max-w-4xl text-6xl leading-none font-semibold md:text-7xl xl:text-[5.7rem]">
                好看的 UI，应该让你一进来就想立刻出图。
              </h1>
              <p className="max-w-2xl text-base leading-8 text-[var(--ink-soft)] md:text-lg">
                Narra Image 把首页做成第一块工作台。普通用户直接开写提示词，
                高级用户再决定要不要切到自己的 OpenAI 兼容渠道。
              </p>
            </div>
            <div className="grid gap-3 text-sm text-[var(--ink-soft)] md:grid-cols-3">
              <div className="studio-card rounded-[1.5rem] px-4 py-4">
                默认内置渠道
                <div className="mt-2 text-2xl font-semibold text-[var(--ink)]">5 分 / 次</div>
              </div>
              <div className="studio-card rounded-[1.5rem] px-4 py-4">
                新用户起始积分
                <div className="mt-2 text-2xl font-semibold text-[var(--ink)]">500</div>
              </div>
              <div className="studio-card rounded-[1.5rem] px-4 py-4">
                高级用户可选
                <div className="mt-2 text-2xl font-semibold text-[var(--ink)]">自填渠道</div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1.2fr_0.8fr]">
            {works.slice(0, 2).map((work) => (
              <div
                key={work.id}
                className="studio-card overflow-hidden rounded-[2rem] border border-[var(--line)]"
              >
                <img src={work.image} alt={work.title} className="aspect-[4/5] w-full object-cover" />
                <div className="p-5">
                  <div className="text-xs uppercase tracking-[0.28em] text-[var(--ink-soft)]">
                    Featured
                  </div>
                  <h3 className="mt-2 text-2xl font-medium">{work.title}</h3>
                  <p className="mt-3 line-clamp-2 text-sm leading-7 text-[var(--ink-soft)]">
                    {work.prompt}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <GeneratorStudio compact currentUser={currentUser} />
      </section>

      <section className="mx-auto mt-10 max-w-7xl px-5 md:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-[var(--ink-soft)]">
              Curated Gallery
            </p>
            <h2 className="editorial-title mt-2 text-5xl font-semibold">
              灵感流存在，但它是为了推动创作，不是把你拦在门外。
            </h2>
          </div>
          <Link
            href="/create"
            className="rounded-full border border-[var(--line)] bg-white/70 px-5 py-3 text-sm text-[var(--ink-soft)]"
          >
            去工作台继续创作
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {works.map((work, index) => (
            <article
              key={`${work.id}-${index}`}
              className="studio-card overflow-hidden rounded-[2rem]"
            >
              <img src={work.image} alt={work.title} className="aspect-[4/5] w-full object-cover" />
              <div className="space-y-3 p-5">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.24em] text-[var(--ink-soft)]">
                  <span>精选作品</span>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="text-xl font-medium text-[var(--ink)]">{work.title}</h3>
                <p className="line-clamp-3 text-sm leading-7 text-[var(--ink-soft)]">
                  {work.prompt}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
