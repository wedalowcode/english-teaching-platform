import { DataScope } from "@/app/generated/prisma/client";

import { PERMISSIONS } from "./permissions";

import type { PermissionCode } from "./permissions";

export type DefaultRoleGrant = {
  roleCode: string;
  permissionCode: PermissionCode;
  scope: DataScope;
};

/**
 * 角色的初始授权配置。
 *
 * - SYSTEM 权限不写入 RolePermission（SUPER_ADMIN 通过身份获得）；
 * - ADMIN 默认只获得统一后台入口；
 * - 这里只是初始配置，完整业务授权矩阵在后续篇章逐步完善。
 */
export const DEFAULT_ROLE_GRANTS: DefaultRoleGrant[] = [
  // 超级管理员：后台入口
  {
    roleCode: "SUPER_ADMIN",
    permissionCode: "portal.admin",
    scope: DataScope.ALL,
  },

  // 企业负责人
  {
    roleCode: "BOSS",
    permissionCode: "portal.admin",
    scope: DataScope.ALL,
  },
  {
    roleCode: "BOSS",
    permissionCode: "dashboard.view",
    scope: DataScope.ALL,
  },

  // 教务管理
  {
    roleCode: "ACADEMIC",
    permissionCode: "portal.admin",
    scope: DataScope.ALL,
  },

  // 系统管理员
  {
    roleCode: "ADMIN",
    permissionCode: "portal.admin",
    scope: DataScope.ALL,
  },

  // 教师
  {
    roleCode: "TEACHER",
    permissionCode: "portal.admin",
    scope: DataScope.ALL,
  },

  // 代理
  {
    roleCode: "AGENT",
    permissionCode: "portal.admin",
    scope: DataScope.ALL,
  },
  {
    roleCode: "AGENT",
    permissionCode: "lead.view",
    scope: DataScope.OWN,
  },
  {
    roleCode: "AGENT",
    permissionCode: "lead.create",
    scope: DataScope.ALL,
  },
  {
    roleCode: "AGENT",
    permissionCode: "leadFollowUp.view",
    scope: DataScope.OWN,
  },
  {
    roleCode: "AGENT",
    permissionCode: "leadFollowUp.create",
    scope: DataScope.ALL,
  },
  {
    roleCode: "AGENT",
    permissionCode: "enrollment.view",
    scope: DataScope.OWN,
  },
  {
    roleCode: "AGENT",
    permissionCode: "enrollment.create",
    scope: DataScope.ALL,
  },

  // 家长
  {
    roleCode: "PARENT",
    permissionCode: "portal.parent",
    scope: DataScope.ALL,
  },
];

/**
 * 初始化授权写入数据库前必须校验：
 * - 权限必须存在于权限目录；
 * - grantable 为 false 的 SYSTEM 权限不允许写入 RolePermission；
 * - 不支持数据范围的权限只能使用 ALL。
 */
export function assertDefaultRoleGrants(
  grants: DefaultRoleGrant[] = DEFAULT_ROLE_GRANTS
) {
  for (const grant of grants) {
    const definition = PERMISSIONS[grant.permissionCode];

    if (!definition) {
      throw new Error(`未知权限：${grant.permissionCode}`);
    }

    if (!definition.grantable) {
      throw new Error(
        `权限不允许写入 RolePermission：${grant.permissionCode}`
      );
    }

    if (!definition.scopeable && grant.scope !== DataScope.ALL) {
      throw new Error(
        `权限不支持当前数据范围：${grant.permissionCode}`
      );
    }
  }
}
