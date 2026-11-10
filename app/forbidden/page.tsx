import Link from "next/link";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/layout/sign-out-button";
import { getCurrentActor } from "@/lib/auth/current-actor";
import { getPortalDestination } from "@/lib/auth/portal-routing";

export const metadata = {
  title: "无权访问",
};

// 需要读取当前会话来渲染可返回的入口，不能使用静态预渲染
export const instant = false;

export default async function ForbiddenPage() {
  const actor = await getCurrentActor();

  if (!actor) {
    redirect("/login");
  }

  const destination = getPortalDestination(actor);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-5 rounded-xl border bg-card p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold">无权访问</h1>

        <p className="text-sm text-muted-foreground">
          当前账号没有访问该页面的权限，请联系超级管理员。
        </p>

        {destination ? (
          <Link
            href={destination}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            返回可访问工作台
          </Link>
        ) : (
          <p className="text-sm text-muted-foreground">
            当前账号没有已授权的系统入口。
          </p>
        )}

        <div className="flex justify-center">
          <SignOutButton showLabel />
        </div>
      </div>
    </main>
  );
}
