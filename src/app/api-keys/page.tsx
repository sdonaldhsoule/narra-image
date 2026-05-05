import { redirect } from "next/navigation";

import { ApiKeyConsole } from "@/components/api/api-key-console";
import { SiteHeader } from "@/components/marketing/site-header";
import { getApiConfig, serializeApiConfig } from "@/lib/api-config";
import { serializeApiKey } from "@/lib/api-keys";
import { db } from "@/lib/db";
import { serializeUser } from "@/lib/prisma-mappers";
import { getCurrentUserRecord } from "@/lib/server/current-user";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "API — Narra Image",
  description: "创建 API Key，并通过 OpenAI 兼容接口调用 Narra Image。",
};

export default async function ApiKeysPage() {
  const user = await getCurrentUserRecord();
  if (!user) {
    redirect("/login");
  }

  const [apiKeys, apiConfig] = await Promise.all([
    db.apiKey.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    getApiConfig(),
  ]);

  return (
    <main className="pb-20">
      <SiteHeader currentUser={serializeUser(user)} />
      <section className="mx-auto grid max-w-7xl gap-6 px-5 pt-8 md:px-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--ink)] md:text-4xl">
            API 控制台
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--ink-soft)]">
            使用 API Key 在外部工具、自动化脚本和第三方客户端中调用站点内置生图渠道。调用会扣除你的积分，并写入生成记录。
          </p>
        </div>

        <ApiKeyConsole
          apiKeys={apiKeys.map(serializeApiKey)}
          apiConfig={serializeApiConfig(apiConfig)}
        />
      </section>
    </main>
  );
}
