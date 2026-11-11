import Link from "next/link";
import type { ReactNode } from "react";
import { BookOpen, FileText, Home, User } from "lucide-react";

import { SignOutButton } from "@/components/layout/sign-out-button";
import { requirePagePermission } from "@/lib/auth/authorization";

export const instant = false;

/**
 * 家长端底部标签栏。
 *
 * 当前只有首页可用，其余页面在后续模块中实现，
 * 用禁用状态展示，避免点击后进入 404。
 */
const PARENT_TABS = [
  { href: "/parent", label: "首页", icon: Home, enabled: true },
  { href: "/parent/courses", label: "课程", icon: BookOpen, enabled: false },
  { href: "/parent/reports", label: "报告", icon: FileText, enabled: false },
  { href: "/parent/account", label: "我的", icon: User, enabled: false },
];

/**
 * 家长端和统一后台是两套独立门户。
 *
 * 这里统一用 requirePagePermission 校验 portal.parent：
 * 未登录跳转登录页，无入口权限跳转 403。
 */
export default async function ParentLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requirePagePermission("portal.parent");

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col border-x bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold">启航英语</p>
          <p className="text-xs text-muted-foreground">家长中心</p>
        </div>

        <SignOutButton />
      </header>

      <main className="flex-1 px-4 py-5">{children}</main>

      <nav className="sticky bottom-0 z-10 grid grid-cols-4 border-t bg-background/95 backdrop-blur">
        {PARENT_TABS.map((tab) => {
          const Icon = tab.icon;

          if (!tab.enabled) {
            return (
              <span
                key={tab.href}
                aria-disabled
                title="即将上线"
                className="flex flex-col items-center gap-1 py-2.5 text-muted-foreground/40"
              >
                <Icon className="size-5" />
                <span className="text-[11px]">{tab.label}</span>
              </span>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center gap-1 py-2.5 text-primary"
            >
              <Icon className="size-5" />
              <span className="text-[11px]">{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
