import { redirect } from "next/navigation";

import { getCheckInSummary } from "@/lib/benefits/config";
import { db } from "@/lib/db";
import { serializeGeneration, serializeUser } from "@/lib/prisma-mappers";
import { getCurrentUserRecord } from "@/lib/server/current-user";
import { GeneratorStudio } from "@/components/create/generator-studio";
import { SiteHeader } from "@/components/marketing/site-header";
import { getBuiltInProviderConfig } from "@/lib/providers/built-in-provider";

export const dynamic = "force-dynamic";

export default async function CreatePage() {
  const user = await getCurrentUserRecord();
  if (!user) {
    redirect("/login");
  }

  const [savedProvider, jobs, builtInConfig, checkInSummary] = await Promise.all([
    db.savedProviderConfig.findUnique({
      where: { userId: user.id },
      select: {
        baseUrl: true,
        label: true,
        model: true,
        models: true,
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
      take: 50,
    }),
    getBuiltInProviderConfig(),
    getCheckInSummary(user.id),
  ]);

  const currentUser = serializeUser(user);

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[var(--surface)]">
      <SiteHeader currentUser={currentUser} showCheckIn={false} />

      <section className="relative flex flex-1 flex-col overflow-hidden">
        <GeneratorStudio
          checkInSummary={checkInSummary}
          currentUser={currentUser}
          initialGenerations={jobs.map(serializeGeneration)}
          initialSavedProvider={savedProvider}
          builtInModels={builtInConfig.models || []}
          builtInDefaultModel={builtInConfig.model}
        />
      </section>
    </main>
  );
}
