import Link from "next/link";
import { redirect } from "next/navigation";

import { adminMenus } from "@/components/layout/menu-config";
import { PageHeader } from "@/components/shared/page-header";
import { evaluatePermission } from "@/lib/auth/authorization";
import { getCurrentActor } from "@/lib/auth/current-actor";

export const instant = false;

/**
 * 后台工作台。
 *
 * 只要求拥有 portal.admin 入口权限（后台布局已校验），
 * 快捷入口仍然按照具体功能权限过滤。
 *
 * adminMenus 里只保留已经实现的页面，
 * 避免快捷入口点进去是 404。
 */
export default async function AdminHomePage() {
  const actor = await getCurrentActor();

  if (!actor) {
    redirect("/login");
  }

  const items = adminMenus.flatMap((group) =>
    group.items
      .filter((item) => evaluatePermission(item.permission, actor).allowed)
      .map((item) => ({
        ...item,
        group: group.title,
      }))
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="后台工作台"
        description={`欢迎回来，${actor.name}`}
      />

      {items.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg border bg-card p-5 transition-colors hover:bg-accent"
            >
              <div className="font-medium">{item.title}</div>
              <div className="mt-2 text-sm text-muted-foreground">
                {item.group}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
          当前账号尚未获得具体功能权限，请联系超级管理员配置。
        </div>
      )}
    </div>
  );
}
