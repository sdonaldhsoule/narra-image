import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { requireAdminRecord } from "@/lib/server/current-user";
import { SiteHeader } from "@/components/marketing/site-header";
import { AdminNav } from "@/components/admin/admin-nav";
import { InviteCreator } from "@/components/admin/admin-actions";
import { serializeUser } from "@/lib/prisma-mappers";

export const dynamic = "force-dynamic";

export default async function AdminInvitesPage() {
  let admin;
  try {
    admin = await requireAdminRecord();
  } catch {
    redirect("/login");
  }

  const invites = await db.inviteCode.findMany({
    include: {
      usedBy: {
        select: {
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <main className="pb-16">
      <SiteHeader currentUser={serializeUser(admin)} />
      <section className="mx-auto grid max-w-7xl gap-6 px-5 pt-6 md:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-[var(--ink-soft)]">
              Invite Control
            </p>
            <h1 className="editorial-title mt-3 text-5xl font-semibold">
              邀请码不只是准入门槛，也是运营来源标签。
            </h1>
          </div>
          <AdminNav currentPath="/admin/invites" />
        </div>

        <InviteCreator />

        <div className="studio-card overflow-hidden rounded-[2rem]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--line)] bg-white/60 text-[var(--ink-soft)]">
              <tr>
                <th className="px-5 py-4 font-medium">邀请码</th>
                <th className="px-5 py-4 font-medium">备注</th>
                <th className="px-5 py-4 font-medium">状态</th>
                <th className="px-5 py-4 font-medium">使用用户</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((invite) => (
                <tr key={invite.id} className="border-b border-[var(--line)] last:border-none">
                  <td className="px-5 py-4 font-medium">{invite.code}</td>
                  <td className="px-5 py-4 text-[var(--ink-soft)]">{invite.note || "—"}</td>
                  <td className="px-5 py-4">
                    {invite.usedAt ? (
                      <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs text-white">
                        已使用
                      </span>
                    ) : (
                      <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs text-[var(--ink-soft)]">
                        未使用
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-[var(--ink-soft)]">
                    {invite.usedBy?.email || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
