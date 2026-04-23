import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { requireAdminRecord } from "@/lib/server/current-user";
import { SiteHeader } from "@/components/marketing/site-header";
import { AdminNav } from "@/components/admin/admin-nav";
import { InviteBatchToggle, InviteCreator } from "@/components/admin/admin-actions";
import { serializeUser } from "@/lib/prisma-mappers";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminInvitesPage() {
  let admin;
  try {
    admin = await requireAdminRecord();
  } catch {
    redirect("/login");
  }

  const [batches, invites] = await Promise.all([
    db.inviteBatch.findMany({
      include: {
        inviteCodes: {
          select: {
            claimedAt: true,
            id: true,
            usedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.inviteCode.findMany({
      include: {
        batch: {
          select: {
            id: true,
            isPublic: true,
            title: true,
          },
        },
        usedBy: {
          select: {
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <main className="pb-16">
      <SiteHeader currentUser={serializeUser(admin)} />
      <section className="mx-auto grid max-w-7xl gap-6 px-5 pt-6 md:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--ink)] md:text-4xl">
              邀请码管理
            </h1>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              批量生成和管理系统的准入邀请码。
            </p>
          </div>
          <AdminNav currentPath="/admin/invites" />
        </div>

        <InviteCreator />

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="studio-card rounded-[2rem] p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-medium">公开领取入口</h2>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">
                  开放批次会自动同步到邀请码领取页，由系统分配一个邀请码后跳转注册。
                </p>
              </div>
              <Link
                href="/invite-claim"
                className="rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--accent)]"
              >
                打开领取页
              </Link>
            </div>
          </section>

          <section className="studio-card rounded-[2rem] p-5">
            <h2 className="text-xl font-medium">批次概览</h2>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              每次批量生成都会形成一个可独立开放的领取批次。
            </p>
          </section>
        </div>

        <div className="grid gap-4">
          {batches.map((batch) => {
            const remainingCount = batch.inviteCodes.filter((invite) => !invite.usedAt && !invite.claimedAt).length;
            return (
              <article
                key={batch.id}
                className="studio-card grid gap-4 rounded-[1.8rem] p-5 xl:grid-cols-[1.2fr_0.8fr_0.8fr_auto]"
              >
                <div>
                  <div className="text-xs uppercase tracking-[0.28em] text-[var(--ink-soft)]">
                    邀请批次
                  </div>
                  <h2 className="mt-2 text-xl font-medium">{batch.title || "未命名批次"}</h2>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">
                    创建于 {new Date(batch.createdAt).toLocaleString("zh-CN")}
                  </p>
                </div>
                <div>
                  <div className="text-sm text-[var(--ink-soft)]">总数量</div>
                  <div className="mt-3 text-3xl font-semibold text-[var(--ink)]">
                    {batch.inviteCodes.length}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-[var(--ink-soft)]">可领取剩余</div>
                  <div className="mt-3 text-3xl font-semibold text-[var(--accent)]">
                    {remainingCount}
                  </div>
                </div>
                <div className="flex items-end justify-start xl:justify-end">
                  <InviteBatchToggle batchId={batch.id} isPublic={batch.isPublic} />
                </div>
              </article>
            );
          })}
        </div>

        <div className="studio-card overflow-hidden rounded-[2rem]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--line)] bg-white/60 text-[var(--ink-soft)]">
              <tr>
                <th className="px-5 py-4 font-medium">邀请码</th>
                <th className="px-5 py-4 font-medium">批次</th>
                <th className="px-5 py-4 font-medium">备注</th>
                <th className="px-5 py-4 font-medium">状态</th>
                <th className="px-5 py-4 font-medium">使用用户</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((invite) => (
                <tr key={invite.id} className="border-b border-[var(--line)] last:border-none">
                  <td className="px-5 py-4 font-medium">{invite.code}</td>
                  <td className="px-5 py-4 text-[var(--ink-soft)]">
                    {invite.batch?.title || "独立邀请码"}
                    {invite.batch ? (
                      <span className="ml-2 rounded-full border border-[var(--line)] px-2 py-0.5 text-xs">
                        {invite.batch.isPublic ? "已开放" : "未开放"}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-5 py-4 text-[var(--ink-soft)]">{invite.note || "—"}</td>
                  <td className="px-5 py-4">
                    {invite.usedAt ? (
                      <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs text-white">
                        已使用
                      </span>
                    ) : invite.claimedAt ? (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-700">
                        已发放
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
