import type { ReactNode } from "react";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminTopbar } from "@/components/layout/admin-topbar";
import { adminMenus } from "@/components/layout/menu-config";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { requireCurrentUser } from "@/lib/auth-session";
import { evaluatePermission } from "@/lib/auth/authorization";
import { getCurrentActor } from "@/lib/auth/current-actor";

// 鉴权需要在渲染前完成，允许布局阻塞首个响应
export const instant = false;

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const user = await requireCurrentUser();

  const actor = await getCurrentActor();

  // requireCurrentUser 已确认用户有效，actor 缺失只可能是并发禁用导致
  if (!actor || !evaluatePermission("portal.admin", actor).allowed) {
    redirect("/forbidden");
  }

  // 菜单只是权限的展示层：只展示当前用户拥有权限的菜单项
  const menus = adminMenus
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => evaluatePermission(item.permission, actor).allowed
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <SidebarProvider>
      <Suspense fallback={null}>
        <AdminSidebar menus={menus} />
      </Suspense>

      <SidebarInset className="min-w-0">
        <AdminTopbar user={user} />

        <div className="min-w-0 flex-1 p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
