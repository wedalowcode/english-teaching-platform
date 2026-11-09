import "server-only";

import { db } from "@/lib/db";
import type { Prisma } from "@/app/generated/prisma/client";

import type { CreateRoleInput, UpdateRoleInput } from "./schemas";

type RoleListParams = {
  page: number;
  pageSize: number;
  keyword: string;
};

export async function getRoleList(params: RoleListParams) {
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
          userRoles: true,
        },
      },
    },

    orderBy: [
      { isSystem: "desc" },
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
