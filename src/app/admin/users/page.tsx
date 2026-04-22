import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { requireAdminRecord } from "@/lib/server/current-user";
import { SiteHeader } from "@/components/marketing/site-header";
import { AdminNav } from "@/components/admin/admin-nav";
import { CreditAdjuster } from "@/components/admin/admin-actions";
import { fromPrismaRole, serializeUser } from "@/lib/prisma-mappers";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  let admin;
  try {
    admin = await requireAdminRecord();
  } catch {
    redirect("/login");
  }

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      _count: {
        select: {
          generations: true,
        },
      },
      createdAt: true,
      credits: true,
      email: true,
      id: true,
      role: true,
    },
    take: 100,
  });

  return (
    <main className="pb-16">
      <SiteHeader currentUser={serializeUser(admin)} />
      <section className="mx-auto grid max-w-7xl gap-6 px-5 pt-6 md:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-[var(--ink-soft)]">
              Users
            </p>
            <h1 className="editorial-title mt-3 text-5xl font-semibold">
              每个用户的积分与产出，都应该可追踪、可调整。
            </h1>
          </div>
          <AdminNav currentPath="/admin/users" />
        </div>

        <div className="grid gap-4">
          {users.map((user) => (
            <article
              key={user.id}
              className="studio-card grid gap-4 rounded-[1.8rem] p-5 xl:grid-cols-[1.2fr_0.8fr_0.7fr_1fr]"
            >
              <div>
                <div className="text-xs uppercase tracking-[0.28em] text-[var(--ink-soft)]">
                  {fromPrismaRole(user.role)}
                </div>
                <h2 className="mt-2 text-xl font-medium">{user.email}</h2>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">
                  注册于 {new Date(user.createdAt).toLocaleString("zh-CN")}
                </p>
              </div>
              <div>
                <div className="text-sm text-[var(--ink-soft)]">当前积分</div>
                <div className="mt-3 text-3xl font-semibold text-[var(--accent)]">
                  {user.credits}
                </div>
              </div>
              <div>
                <div className="text-sm text-[var(--ink-soft)]">生成次数</div>
                <div className="mt-3 text-3xl font-semibold text-[var(--ink)]">
                  {user._count.generations}
                </div>
              </div>
              <CreditAdjuster userId={user.id} />
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
