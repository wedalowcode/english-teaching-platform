import type { ReactNode } from "react";

import { AdminLayout } from "@/components/layout/admin-layout";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return <AdminLayout>{children}</AdminLayout>;
}
