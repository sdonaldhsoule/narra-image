import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { serializeGeneration, serializeUser } from "@/lib/prisma-mappers";
import { getCurrentUserRecord } from "@/lib/server/current-user";
import { GeneratorStudio } from "@/components/create/generator-studio";
import { SiteHeader } from "@/components/marketing/site-header";

export const dynamic = "force-dynamic";

export default async function CreatePage() {
  const user = await getCurrentUserRecord();
  if (!user) {
    redirect("/login");
  }

  const [savedProvider, jobs] = await Promise.all([
    db.savedProviderConfig.findUnique({
      where: { userId: user.id },
      select: {
        baseUrl: true,
        label: true,
        model: true,
      },
    }),
    db.generationJob.findMany({
      where: { userId: user.id },
      include: {
        images: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 24,
    }),
  ]);

  const currentUser = serializeUser(user);

  return (
    <main className="pb-20">
      <SiteHeader currentUser={currentUser} />

      <section className="mx-auto max-w-7xl px-5 pb-8 pt-4 md:px-8">
        <div className="mb-8 grid gap-4 xl:grid-cols-[0.75fr_1.25fr] xl:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--ink-soft)]">
              Create Workspace
            </p>
            <h1 className="editorial-title mt-3 text-5xl font-semibold md:text-6xl">
              连续创作应该像翻杂志一样顺，不像填后台表单。
            </h1>
          </div>
          <div className="studio-card rounded-[2rem] px-5 py-5 text-sm leading-7 text-[var(--ink-soft)]">
            这里保留更完整的控制权：你可以看最近历史、切换内置与自填渠道、
            保留自定义 Base URL / API Key，并在同一处持续迭代提示词。
          </div>
        </div>

        <GeneratorStudio
          currentUser={currentUser}
          initialGenerations={jobs.map(serializeGeneration)}
          initialSavedProvider={savedProvider}
        />
      </section>
    </main>
  );
}
