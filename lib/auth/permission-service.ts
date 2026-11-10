import "server-only";

import { DataScope } from "@/app/generated/prisma/client";

import { PERMISSIONS } from "./permissions";

import type { CurrentActor } from "./authorization";
import type { PermissionCode } from "./permissions";

/**
 * 获取某个权限在当前用户身上的有效数据范围。
 *
 * 一个用户可能同时拥有多个角色，多角色授权取并集：
 * 任意角色给出 ALL 即表示可访问全部数据；
 * OWN 与 ASSIGNED 同时存在时表示两类数据都可以访问。
 */
export function getPermissionScopes(
  permissionCode: PermissionCode,
  actor: CurrentActor
): DataScope[] {
  const scopes = actor.grants
    .filter((grant) => grant.permissionCode === permissionCode)
    .map((grant) => grant.scope);

  return [...new Set(scopes)];
}

const VALID_SCOPES = new Set<DataScope>([
  DataScope.ALL,
  DataScope.OWN,
  DataScope.ASSIGNED,
]);

/**
 * 写入 RolePermission 之前必须校验：
 * - 权限必须存在于权限目录；
 * - 数据范围必须是有效枚举值；
 * - 不支持数据范围的权限只能使用 ALL。
 *
 * 无效数据范围必须拒绝，不能默认扩大为 ALL。
 */
export function validatePermissionScope(
  permissionCode: PermissionCode,
  scope: DataScope
) {
  const permission = PERMISSIONS[permissionCode];

  if (!permission) {
    throw new Error("未知权限");
  }

  if (!VALID_SCOPES.has(scope)) {
    throw new Error("无效的数据范围");
  }

  if (!permission.scopeable && scope !== DataScope.ALL) {
    throw new Error("该权限不支持配置数据范围");
  }
}
