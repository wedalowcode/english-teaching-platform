import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { requireCurrentUser } from "@/lib/auth-session";

/**
 * 临时的管理员校验：先确认已登录，再确认拥有 ADMIN 角色。
 * 第 17 篇会升级为基于角色和权限的服务端校验。
 */
export const requireAdmin = cache(async () => {
  const user = await requireCurrentUser();

  const isAdmin = await db.userRole.findFirst({
    where: {
      userId: user.id,
      role: { code: "ADMIN" },
    },
    select: { id: true },
  });

  if (!isAdmin) {
    redirect("/forbidden");
  }

  return user;
});

/**
 * 早期篇章里的写操作守卫，现在复用真正的管理员校验。
 */
export async function requireUserAdmin() {
  await requireAdmin();
}
