import { evaluatePermission } from "./authorization";

import type { CurrentActor } from "./authorization";

/**
 * 根据当前用户的有效入口权限决定默认访问地址。
 *
 * 不直接判断角色编码：角色不等于入口权限。
 * 同时拥有两个入口时，优先进入统一后台。
 */
export function getPortalDestination(
  actor: CurrentActor
): "/admin" | "/parent" | null {
  if (evaluatePermission("portal.admin", actor).allowed) {
    return "/admin";
  }

  if (evaluatePermission("portal.parent", actor).allowed) {
    return "/parent";
  }

  return null;
}
