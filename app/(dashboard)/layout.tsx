import type { ReactNode } from "react";
import { Suspense } from "react";

import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminTopbar } from "@/components/layout/admin-topbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { requireCurrentUser } from "@/server/auth/session";

// 鉴权需要在渲染前完成，允许布局阻塞首个响应
export const instant = false;

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const user = await requireCurrentUser();

  return (
    <SidebarProvider>
      <Suspense fallback={null}>
        <AdminSidebar />
      </Suspense>

      <SidebarInset className="min-w-0">
        <AdminTopbar user={user} />

        <div className="min-w-0 flex-1 p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
