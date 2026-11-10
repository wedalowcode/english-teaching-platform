import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { checkPermission } from "@/lib/auth/authorization";

export const instant = false;

/**
 * 家长端和统一后台是两套独立门户，
 * 这里只保护家长端入口，避免家长账号被错误导入后台。
 */
export default async function ParentLayout({
  children,
}: {
  children: ReactNode;
}) {
  const decision = await checkPermission("portal.parent");

  if (decision.reason === "UNAUTHENTICATED") {
    redirect("/login");
  }

  if (!decision.allowed) {
    redirect("/forbidden");
  }

  return <div className="min-h-screen bg-background">{children}</div>;
}
