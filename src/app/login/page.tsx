import Link from "next/link";

import { AuthForm } from "@/components/marketing/auth-form";
import { SiteHeader } from "@/components/marketing/site-header";

export default function LoginPage() {
  return (
    <main className="pb-20">
      <SiteHeader currentUser={null} />

      <section className="mx-auto grid max-w-6xl gap-8 px-5 pt-10 md:px-8 xl:grid-cols-[0.94fr_1.06fr]">
        <div className="space-y-5">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--ink-soft)]">
            Welcome Back
          </p>
          <h1 className="editorial-title text-6xl leading-none font-semibold">
            登录后，
            <br />
            你才真的进入创作现场。
          </h1>
          <p className="max-w-xl text-base leading-8 text-[var(--ink-soft)]">
            默认走站点内置渠道，普通用户不需要理解 Key 和 Base URL；
            如果你是进阶用户，登录后再切到自己的 OpenAI 兼容渠道即可。
          </p>
          <div className="studio-card rounded-[2rem] p-5 text-sm leading-7 text-[var(--ink-soft)]">
            还没有账号？
            <Link href="/register" className="ml-2 font-medium text-[var(--accent)]">
              使用邀请码注册
            </Link>
          </div>
        </div>

        <AuthForm mode="login" />
      </section>
    </main>
  );
}
