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
 * 1. SYSTEM 权限只允许有效 SUPER_ADMIN 通过特殊授权规则获得；
 * 2. SYSTEM 权限不允许通过 RolePermission 授予普通角色；
 * 3. BUSINESS 权限必须存在有效授权，不因为 SUPER_ADMIN 身份自动放行；
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

  // 超级管理员只绕过 SYSTEM 权限
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

  // SYSTEM 权限不允许普通角色通过 RolePermission 获得
  if (permission.domain === "SYSTEM") {
    return {
      allowed: false,
      actor,
      scopes: [],
      reason: "FORBIDDEN",
    };
  }

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
