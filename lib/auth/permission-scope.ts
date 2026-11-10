import "server-only";

import { DataScope } from "@/app/generated/prisma/client";

import { PERMISSIONS } from "./permissions";
import { getPermissionScopes } from "./permission-service";

import type { CurrentActor } from "./authorization";
import type { PermissionCode } from "./permissions";

type ScopeResolver = {
  ALL: (actor: CurrentActor) => object | null;
  OWN: (actor: CurrentActor) => object | null;
  ASSIGNED: (actor: CurrentActor) => object | null;
};

/**
 * 资源级数据范围解析器。
 *
 * 不同业务资源的数据归属关系不同（学生、线索、排课等业务模型尚未落地），
 * 因此这里先不注册任何解析器。对应业务模型实现后，
 * 必须按照实际的 Prisma 关系字段补充解析规则，不能照抄示例。
 */
export const RESOURCE_SCOPE_RESOLVERS: Record<string, ScopeResolver> = {};

/**
 * 把数据范围转换成 Prisma 查询条件。
 *
 * 返回 null 表示不额外附加数据范围条件（ALL 或不支持数据范围的权限），
 * 其他情况返回查询条件，列表、详情、修改、删除都必须使用它。
 */
export function buildScopeWhere(
  permissionCode: PermissionCode,
  actor: CurrentActor
): object | null {
  const permission = PERMISSIONS[permissionCode];

  if (!permission.scopeable) {
    return null;
  }

  const scopes = getPermissionScopes(permissionCode, actor);

  if (scopes.length === 0) {
    throw new Error("没有有效的数据范围");
  }

  if (scopes.includes(DataScope.ALL)) {
    return null;
  }

  const resolver = RESOURCE_SCOPE_RESOLVERS[permission.resource];

  if (!resolver) {
    throw new Error(`未配置资源数据范围解析器：${permission.resource}`);
  }

  const conditions = scopes
    .map((scope) => resolver[scope](actor))
    .filter((item): item is object => item !== null);

  if (conditions.length === 0) {
    throw new Error("无法解析数据范围");
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  return {
    OR: conditions,
  };
}
