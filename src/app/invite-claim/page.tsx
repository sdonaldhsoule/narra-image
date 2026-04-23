import { db } from "@/lib/db";
import { getCurrentUserRecord } from "@/lib/server/current-user";
import { serializeUser } from "@/lib/prisma-mappers";
import { SiteHeader } from "@/components/marketing/site-header";
import { InviteClaimBoard } from "@/components/invites/invite-claim-board";

export const dynamic = "force-dynamic";

export default async function InviteClaimPage() {
  const user = await getCurrentUserRecord();
  const batches = await db.inviteBatch.findMany({
    where: {
      isPublic: true,
    },
    include: {
      inviteCodes: {
        select: {
          claimedAt: true,
          id: true,
          usedAt: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
  });

  const openBatches = batches
    .map((batch) => ({
      id: batch.id,
      remainingCount: batch.inviteCodes.filter((invite) => !invite.usedAt && !invite.claimedAt).length,
      title: batch.title,
      totalCount: batch.inviteCodes.length,
    }))
    .filter((batch) => batch.remainingCount > 0);

  return (
    <main className="pb-20">
      <SiteHeader currentUser={user ? serializeUser(user) : null} />

      <section className="mx-auto grid max-w-6xl gap-8 px-5 pt-10 md:px-8">
        <div className="space-y-5">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--ink-soft)]">
            Claim Access
          </p>
          <h1 className="editorial-title text-6xl leading-none font-semibold">
            领取邀请码，
            <br />
            再直接注册。
          </h1>
          <p className="max-w-xl text-base leading-8 text-[var(--ink-soft)]">
            这里展示的是管理员当前开放领取的邀请码批次。点击领取后，
            系统会自动分配一个邀请码，并带你进入注册页。
          </p>
        </div>

        {openBatches.length > 0 ? (
          <InviteClaimBoard batches={openBatches} />
        ) : (
          <div className="studio-card rounded-[2rem] border border-dashed border-[var(--line)] p-10 text-center">
            <h2 className="text-2xl font-semibold text-[var(--ink)]">当前没有开放领取的邀请码</h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--ink-soft)]">
              稍后再来看看，或者联系管理员获取专属邀请码。
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
