import type { ReactNode } from "react";

import { AdminSidebar } from "./admin-sidebar";
import { AdminTopbar } from "./admin-topbar";

type AdminLayoutProps = {
  children: ReactNode;
};

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F3F6FC]">
      {/* 左侧菜单 */}
      <AdminSidebar />

      {/* 右侧主工作区 */}
      <div className="ml-60 flex min-h-screen min-w-0 flex-col">
        <AdminTopbar />

        <main className="min-w-0 flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
