import "server-only";

import { redirect } from "next/navigation";

import { getCurrentActor } from "./current-actor";
import { PERMISSIONS, SYSTEM_ROLE_CODES } from "./permissions";

import type { DataScope } from "@/app/generated/prisma/client";
import type { PermissionCode } from "./permissions";

export type CurrentActor = {
  userId: string;
  name: string;
  email: string;

  isActive: boolean;

  roleCodes: string[];
  activeRoleCodes: string[];

  grants: {
    permissionCode: string;
    scope: DataScope;
  }[];
};

export type PermissionDecision = {
  allowed: boolean;
  actor: CurrentActor | null;
  scopes: DataScope[];
  reason?: "UNAUTHENTICATED" | "FORBIDDEN";
};

/**
 * 纯权限判断：基于已经解析出的当前用户上下文计算是否放行。
 *
 * 规则：
 * 1. 有效 SUPER_ADMIN 通过内置规则自动获得所有 SYSTEM 权限（无需写入 RolePermission）；
 * 2. 所有其他角色（包括其他 SYSTEM 域权限）必须通过 RolePermission 表获得授权；
 * 3. 权限 domain 仅用于区分 SUPER_ADMIN 内置绕过范围，不限制普通角色通过分配获得；
 * 4. 多角色授权取并集，数据范围由调用方通过 getPermissionScopes 合并。
 */
export function evaluatePermission(
  permissionCode: PermissionCode,
  actor: CurrentActor
): PermissionDecision {
  const permission = PERMISSIONS[permissionCode];

  if (!permission) {
    return {
      allowed: false,
      actor,
      scopes: [],
      reason: "FORBIDDEN",
    };
  }

  // 有效 SUPER_ADMIN 对所有 SYSTEM 权限内置绕过，无需写入 RolePermission
  if (
    permission.domain === "SYSTEM" &&
    actor.activeRoleCodes.includes(SYSTEM_ROLE_CODES.SUPER_ADMIN)
  ) {
    return {
      allowed: true,
      actor,
      scopes: [],
    };
  }

  // BUSINESS 权限 + 非超管角色的 SYSTEM 权限：统一通过 RolePermission 判断
  const scopes = actor.grants
    .filter((grant) => grant.permissionCode === permissionCode)
    .map((grant) => grant.scope);

  if (scopes.length === 0) {
    return {
      allowed: false,
      actor,
      scopes: [],
      reason: "FORBIDDEN",
    };
  }

  return {
    allowed: true,
    actor,
    scopes: [...new Set(scopes)],
  };
}

/**
 * 基于当前登录会话的权限判断，身份只能来自服务端会话。
 */
export async function checkPermission(
  permissionCode: PermissionCode
): Promise<PermissionDecision> {
  const actor = await getCurrentActor();

  if (!actor) {
    return {
      allowed: false,
      actor: null,
      scopes: [],
      reason: "UNAUTHENTICATED",
    };
  }

  return evaluatePermission(permissionCode, actor);
}

/**
 * 页面和服务端操作的权限守卫：
 * 未登录跳转登录页，无权限统一跳转 403 页面。
 *
 * 每个页面、每个 Service/Action 都声明自己需要的权限编码，
 * 不再使用笼统的管理员守卫。
 */
export async function requirePagePermission(permissionCode: PermissionCode) {
  const decision = await checkPermission(permissionCode);

  if (decision.reason === "UNAUTHENTICATED") {
    redirect("/login");
  }

  if (!decision.allowed || !decision.actor) {
    redirect("/forbidden");
  }

  return decision.actor;
}
