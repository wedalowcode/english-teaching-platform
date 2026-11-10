import "server-only";

import { PARENT_RESOURCE_FINDERS } from "./parent-resource";
import { PERMISSIONS } from "./permissions";
import { buildScopeWhere } from "./permission-scope";
import { getPermissionScopes } from "./permission-service";

import type { CurrentActor } from "./authorization";
import type { PermissionCode } from "./permissions";

/**
 * 创建业务数据时的关联资源校验。
 *
 * 拥有 schedule.create 不代表可以把任意学生用于排课，
 * 创建操作必须验证 payload 中引用的父资源：
 * 当前用户必须拥有对应的使用权限，并且父资源在其数据范围内。
 */
export async function assertCreateScope(
  permissionCode: PermissionCode,
  payload: Record<string, unknown>,
  actor: CurrentActor
) {
  const definition = PERMISSIONS[permissionCode];

  const dependencies = definition.createScopes ?? [];

  for (const dependency of dependencies) {
    const parentId = payload[dependency.relation];

    if (typeof parentId !== "string" || parentId.length === 0) {
      throw new Error(`缺少关联字段：${dependency.relation}`);
    }

    const scopes = getPermissionScopes(dependency.permission, actor);

    if (scopes.length === 0) {
      throw new Error("无权使用关联业务资源");
    }

    const parentPermission = PERMISSIONS[dependency.permission];

    const finder = PARENT_RESOURCE_FINDERS[parentPermission.resource];

    if (!finder) {
      throw new Error(
        `未配置父资源查询器：${parentPermission.resource}`
      );
    }

    const where = buildScopeWhere(dependency.permission, actor);

    const allowed = await finder(parentId, where ?? {});

    if (!allowed) {
      throw new Error("关联资源不存在或无权使用");
    }
  }
}
