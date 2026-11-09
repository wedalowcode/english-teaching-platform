import "server-only";

import { requireCurrentUser } from "@/server/auth/session";

/**
 * 当前只校验是否已登录。
 * 角色权限（管理员/教务/教师）在后续篇章中接入。
 */
export async function requireUserAdmin() {
  await requireCurrentUser();
}
