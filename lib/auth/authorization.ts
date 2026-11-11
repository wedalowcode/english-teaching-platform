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

export type PermissionDenialCode = "UNAUTHENTICATED" | "FORBIDDEN";

/**
 * 权限判断结果使用判别联合：
 * allowed 为 true 时一定有 actor 和 scopes；
 * allowed 为 false 时一定有拒绝原因 code。
 */
export type PermissionDecision =
  | {
      allowed: true;
      actor: CurrentActor;
      scopes: DataScope[];
    }
  | {
      allowed: false;
      code: PermissionDenialCode;
      actor: CurrentActor | null;
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
      code: "FORBIDDEN",
      actor,
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
      code: "FORBIDDEN",
      actor,
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
      code: "UNAUTHENTICATED",
      actor: null,
    };
  }

  return evaluatePermission(permissionCode, actor);
}

/**
 * 页面权限守卫：未登录跳转登录页，无权限统一跳转 403 页面。
 *
 * 只能用于页面和布局，不能用于 Server Action 或 Service：
 * 这里通过 redirect 抛异常改变导航，在 Action 中会中断返回值。
 *
 * 每个页面都声明自己需要的权限编码，不再使用笼统的管理员守卫。
 */
export async function requirePagePermission(
  permissionCode: PermissionCode
): Promise<CurrentActor> {
  const decision = await checkPermission(permissionCode);

  if (!decision.allowed) {
    redirect(decision.code === "UNAUTHENTICATED" ? "/login" : "/forbidden");
  }

  return decision.actor;
}

export type ActionPermissionResult =
  | { ok: true; actor: CurrentActor; scopes: DataScope[] }
  | { ok: false; message: string };

/**
 * Server Action / Service 的权限守卫：不跳转，返回结构化失败结果。
 *
 * 调用方在参数校验之前先判断 ok，未通过时直接返回 message。
 */
export async function requireActionPermission(
  permissionCode: PermissionCode
): Promise<ActionPermissionResult> {
  const decision = await checkPermission(permissionCode);

  if (!decision.allowed) {
    return {
      ok: false,
      message:
        decision.code === "UNAUTHENTICATED"
          ? "登录状态已失效，请重新登录"
          : "当前账号没有执行该操作的权限",
    };
  }

  return {
    ok: true,
    actor: decision.actor,
    scopes: decision.scopes,
  };
}
