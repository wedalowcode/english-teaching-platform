import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { checkPermission } from "@/lib/auth/authorization";
import { requireCurrentUser } from "@/lib/auth-session";

/**
 * 系统管理功能守卫。
 *
 * SYSTEM 权限只允许有效 SUPER_ADMIN 通过特殊授权规则获得，
 * 普通 ADMIN 不再因为角色编码自动获得系统管理权限。
 *
 * 用户管理、角色管理暂时共用一个守卫：
 * SYSTEM 域权限对 SUPER_ADMIN 整体放行，具体到页面级别的权限细分
 * 在后续角色授权篇章中落地。
 */
export const requireAdmin = cache(async () => {
  const user = await requireCurrentUser();

  const decision = await checkPermission("user.view");

  if (!decision.allowed) {
    redirect("/forbidden");
  }

  return user;
});

/**
 * 早期篇章里的写操作守卫，现在复用真正的系统权限校验。
 */
export async function requireUserAdmin() {
  await requireAdmin();
}
