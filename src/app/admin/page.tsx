import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { getBuiltInProviderConfigForAdmin } from "@/lib/providers/built-in-provider";
import { requireAdminRecord } from "@/lib/server/current-user";
import { BuiltInProviderForm } from "@/components/admin/admin-actions";
import { SiteHeader } from "@/components/marketing/site-header";
import { AdminNav } from "@/components/admin/admin-nav";
import { serializeUser } from "@/lib/prisma-mappers";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  let admin;
  try {
    admin = await requireAdminRecord();
  } catch {
    redirect("/login");
  }

  const [userCount, inviteCount, generationCount, featuredCount, providerConfig] =
    await Promise.all([
      db.user.count(),
      db.inviteCode.count(),
      db.generationJob.count(),
      db.generationJob.count({
        where: {
          featuredAt: {
            not: null,
          },
        },
      }),
      getBuiltInProviderConfigForAdmin(),
    ]);

  return (
    <main className="pb-16">
      <SiteHeader currentUser={serializeUser(admin)} />
      <section className="mx-auto grid max-w-7xl gap-6 px-5 pt-6 md:px-8">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.32em] text-[var(--ink-soft)]">
            Admin Console
          </p>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="editorial-title text-5xl font-semibold md:text-6xl">
                后台先做轻，但要一眼看得住全局。
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-8 text-[var(--ink-soft)]">
                这里不是复杂 SaaS 仪表盘，而是产品控制面板。
                管邀请码、看用户、调积分、看全站图片，就够把第一版稳稳带起来。
              </p>
            </div>
            <AdminNav currentPath="/admin" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["注册用户", userCount],
            ["邀请码总数", inviteCount],
            ["生成记录", generationCount],
            ["首页精选", featuredCount],
          ].map(([label, value]) => (
            <div key={label} className="studio-card rounded-[1.8rem] p-5">
              <div className="text-sm text-[var(--ink-soft)]">{label}</div>
              <div className="mt-3 text-4xl font-semibold text-[var(--ink)]">{value}</div>
            </div>
          ))}
        </div>

        <BuiltInProviderForm initialConfig={providerConfig} />
      </section>
    </main>
  );
}
