import "server-only";

import { db } from "@/lib/db";
import { requirePagePermission } from "@/lib/auth/authorization";
import {
  PERMISSIONS,
  ROLE_ASSIGNABLE_PERMISSION_CODES,
  SYSTEM_ROLE_CODES,
} from "@/lib/auth/permissions";
import type { Prisma } from "@/app/generated/prisma/client";
import type { PermissionCode } from "@/lib/auth/permissions";

import type {
  CreateRoleInput,
  RoleListQuery,
  UpdateRoleInput,
} from "./schemas";

type RoleListParams = RoleListQuery & {
  pageSize: number;
};

export async function getRoleList(params: RoleListParams) {
  await requirePagePermission("role.view");

  const { pageSize, keyword } = params;

  const where: Prisma.RoleWhereInput = keyword
    ? {
        OR: [
          {
            name: {
              contains: keyword,
              mode: "insensitive",
            },
          },
          {
            code: {
              contains: keyword,
              mode: "insensitive",
            },
          },
        ],
      }
    : {};

  const total = await db.role.count({ where });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const page = Math.min(Math.max(1, params.page), totalPages);

  const items = await db.role.findMany({
    where,

    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      isSystem: true,
      isActive: true,
      createdAt: true,

      _count: {
        select: {
          userRoles: {
            where: {
              user: { status: "ACTIVE" },
            },
          },
        },
      },
    },

    orderBy: [
      { isSystem: "desc" },
      { sort: "asc" },
      { createdAt: "asc" },
      { id: "asc" },
    ],

    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
  };
}

export type RoleOperationResult =
  | { success: true }
  | {
      success: false;
      code: "NOT_FOUND" | "CODE_TAKEN" | "SYSTEM_ROLE";
      message: string;
    };

function getErrorCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;

    return typeof code === "string" ? code : undefined;
  }

  return undefined;
}

export async function getRoleById(id: string) {
  await requirePagePermission("role.view");

  return db.role.findUnique({
    where: { id },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      isSystem: true,
      isActive: true,
    },
  });
}

export async function createRole(
  input: CreateRoleInput
): Promise<RoleOperationResult> {
  await requirePagePermission("role.create");

  try {
    await db.role.create({
      data: {
        code: input.code,
        name: input.name,
        description: input.description,
        isSystem: false,
        isActive: true,
      },
    });

    return { success: true };
  } catch (error) {
    if (getErrorCode(error) === "P2002") {
      return {
        success: false,
        code: "CODE_TAKEN",
        message: "角色编码已经存在",
      };
    }

    throw error;
  }
}

export async function updateRole(
  id: string,
  input: UpdateRoleInput
): Promise<RoleOperationResult> {
  await requirePagePermission("role.edit");

  try {
    await db.role.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
      },
    });

    return { success: true };
  } catch (error) {
    if (getErrorCode(error) === "P2025") {
      return {
        success: false,
        code: "NOT_FOUND",
        message: "角色不存在或已被删除",
      };
    }

    throw error;
  }
}

export async function setRoleStatus(
  id: string,
  isActive: boolean
): Promise<RoleOperationResult> {
  await requirePagePermission("role.disable");

  const role = await db.role.findUnique({
    where: { id },
    select: {
      id: true,
      isSystem: true,
    },
  });

  if (!role) {
    return {
      success: false,
      code: "NOT_FOUND",
      message: "角色不存在或已被删除",
    };
  }

  if (role.isSystem && !isActive) {
    return {
      success: false,
      code: "SYSTEM_ROLE",
      message: "系统角色不允许停用",
    };
  }

  await db.role.update({
    where: { id },
    data: { isActive },
  });

  return { success: true };
}

type RoleUsersParams = {
  roleId: string;
  page: number;
  pageSize: number;
  keyword: string;
};

export async function getRoleUsers(params: RoleUsersParams) {
  await requirePagePermission("role.assignUser");

  const { roleId, pageSize, keyword } = params;

  const role = await getRoleById(roleId);

  if (!role) {
    return null;
  }

  const where: Prisma.UserWhereInput = {
    userRoles: {
      some: { roleId },
    },
    ...(keyword
      ? {
          OR: [
            { name: { contains: keyword, mode: "insensitive" } },
            { username: { contains: keyword, mode: "insensitive" } },
            { email: { contains: keyword, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const total = await db.user.count({ where });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const currentPage = Math.min(Math.max(1, params.page), totalPages);

  const items = await db.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      phone: true,
      status: true,
      createdAt: true,
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
  });

  return {
    role,
    items,
    total,
    page: currentPage,
    totalPages,
  };
}

export async function getAvailableRoleUsers(params: RoleUsersParams) {
  await requirePagePermission("role.assignUser");

  const { roleId, pageSize, keyword } = params;

  const where: Prisma.UserWhereInput = {
    userRoles: {
      none: { roleId },
    },
    ...(keyword
      ? {
          OR: [
            { name: { contains: keyword, mode: "insensitive" } },
            { username: { contains: keyword, mode: "insensitive" } },
            { email: { contains: keyword, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const total = await db.user.count({ where });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const page = Math.min(Math.max(1, params.page), totalPages);

  const items = await db.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return {
    items,
    total,
    page,
    totalPages,
  };
}

export async function addUserToRole(roleId: string, userId: string) {
  await requirePagePermission("role.assignUser");

  const [role, user] = await Promise.all([
    db.role.findUnique({
      where: { id: roleId },
      select: { id: true },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: { id: true },
    }),
  ]);

  if (!role || !user) {
    return {
      success: false as const,
      message: "角色或用户不存在",
    };
  }

  await db.userRole.upsert({
    where: {
      userId_roleId: {
        userId,
        roleId,
      },
    },
    update: {},
    create: {
      userId,
      roleId,
    },
  });

  return { success: true as const };
}

export async function removeUserFromRole(roleId: string, userId: string) {
  await requirePagePermission("role.assignUser");

  await db.userRole.deleteMany({
    where: {
      roleId,
      userId,
    },
  });

  return { success: true as const };
}

/**
 * 角色权限配置页数据。
 *
 * 只展示已经实现并开放授权的功能。
 * 未来业务模块完成后，通过 ROLE_ASSIGNABLE_PERMISSION_CODES 扩展。
 */
export async function getRolePermissionConfig(roleId: string) {
  await requirePagePermission("role.assignPermissions");

  const role = await db.role.findUnique({
    where: { id: roleId },
    select: {
      id: true,
      code: true,
      name: true,
      isSystem: true,
    },
  });

  if (!role) {
    return null;
  }

  const permissions = ROLE_ASSIGNABLE_PERMISSION_CODES.map((code) => {
    const item = PERMISSIONS[code];

    return {
      code,
      name: item.name,
      module: item.module,
      scopeable: item.scopeable,
    };
  });

  // 超级管理员的 SYSTEM 权限由授权规则内置，
  // 配置页只用于展示，不参与勾选保存
  const systemPermissions =
    role.code === SYSTEM_ROLE_CODES.SUPER_ADMIN
      ? Object.entries(PERMISSIONS)
          .filter(([, item]) => item.domain === "SYSTEM")
          .map(([code, item]) => ({
            code: code as PermissionCode,
            name: item.name,
            module: item.module,
          }))
      : [];

  const assigned = await db.rolePermission.findMany({
    where: {
      roleId,
      permissionCode: {
        in: [...ROLE_ASSIGNABLE_PERMISSION_CODES],
      },
    },
    select: {
      permissionCode: true,
      scope: true,
    },
  });

  return {
    role,
    permissions,
    systemPermissions,
    assigned,
  };
}
