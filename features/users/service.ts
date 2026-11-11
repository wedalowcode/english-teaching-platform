import "server-only";

import { db } from "@/lib/db";
import { requirePagePermission } from "@/lib/auth/authorization";
import type { Prisma, UserStatus } from "@/app/generated/prisma/client";
import { hashPassword } from "@/lib/password";
import type { CreateUserInput, UpdateUserInput } from "./schemas";

type UserListParams = {
  page: number;
  pageSize: number;
  keyword: string;
  status?: UserStatus;
};

export type UserOperationResult =
  | {
      success: true;
    }
  | {
      success: false;
      code: "NOT_FOUND" | "USERNAME_TAKEN" | "EMAIL_TAKEN" | "CONFLICT";
      message: string;
    };

function getErrorCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;

    return typeof code === "string" ? code : undefined;
  }

  return undefined;
}

function getUniqueTargetFields(error: unknown): string[] {
  if (
    typeof error !== "object" ||
    error === null ||
    !("meta" in error) ||
    !error.meta ||
    typeof error.meta !== "object" ||
    !("target" in error.meta)
  ) {
    return [];
  }

  const target = error.meta.target;

  if (Array.isArray(target)) {
    return target.map(String);
  }

  return typeof target === "string" ? [target] : [];
}

const USER_NOT_FOUND = {
  success: false,
  code: "NOT_FOUND",
  message: "用户不存在或已被删除",
} as const;

const USER_HAS_RELATIONS = {
  success: false,
  code: "CONFLICT",
  message: "该用户存在关联数据，无法删除，请改为停用",
} as const;

export async function getUserList(params: UserListParams) {
  await requirePagePermission("user.view");

  const { pageSize, keyword, status } = params;

  const where: Prisma.UserWhereInput = {};

  if (keyword) {
    where.OR = [
      { name: { contains: keyword, mode: "insensitive" } },
      { username: { contains: keyword, mode: "insensitive" } },
      { email: { contains: keyword, mode: "insensitive" } },
      { phone: { contains: keyword } },
    ];
  }

  if (status) {
    where.status = status;
  }

  const total = await db.user.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, params.page), totalPages);

  const items = await db.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      phone: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      userRoles: {
        select: {
          roleId: true,
        },
      },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { items, total, page, pageSize, totalPages };
}

export async function createUser(input: CreateUserInput) {
  await requirePagePermission("user.create");

  const userId = crypto.randomUUID();
  const passwordHash = await hashPassword(input.password);

  try {
    return await db.user.create({
      data: {
        id: userId,
        name: input.name,
        email: input.email,
        username: input.username,
        phone: input.phone,

        accounts: {
          create: {
            id: crypto.randomUUID(),
            accountId: userId,
            providerId: "credential",
            password: passwordHash,
          },
        },
      },
      select: { id: true },
    });
  } catch (error) {
    if (getErrorCode(error) === "P2002") {
      const fields = getUniqueTargetFields(error);

      if (fields.includes("username")) {
        throw new Error("用户名已存在");
      }

      if (fields.includes("email")) {
        throw new Error("邮箱已被使用");
      }
    }

    throw error;
  }
}

export async function getUserById(id: string) {
  await requirePagePermission("user.view");

  return db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      phone: true,
    },
  });
}

export async function getRoleOptions() {
  await requirePagePermission("user.assignRole");

  return db.role.findMany({
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
    },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
  });
}

export async function updateUserRoles(userId: string, roleIds: string[]) {
  await requirePagePermission("user.assignRole");

  const ids = [...new Set(roleIds)];

  return db.$transaction(async (tx) => {
    const [user, roles] = await Promise.all([
      tx.user.findUnique({
        where: { id: userId },
        select: { id: true },
      }),
      tx.role.findMany({
        where: { id: { in: ids } },
        select: { id: true },
      }),
    ]);

    if (!user) {
      return { success: false as const, message: "用户不存在" };
    }

    if (roles.length !== ids.length) {
      return { success: false as const, message: "存在无效角色" };
    }

    await tx.userRole.deleteMany({
      where: { userId },
    });

    if (ids.length > 0) {
      await tx.userRole.createMany({
        data: ids.map((roleId) => ({
          userId,
          roleId,
        })),
      });
    }

    return { success: true as const };
  });
}

export async function updateUser(
  id: string,
  input: UpdateUserInput
): Promise<UserOperationResult> {
  await requirePagePermission("user.edit");

  try {
    await db.user.update({
      where: { id },
      data: {
        name: input.name,
        email: input.email,
        username: input.username,
        phone: input.phone,
      },
      select: {
        id: true,
      },
    });

    return { success: true };
  } catch (error) {
    const code = getErrorCode(error);

    if (code === "P2002") {
      const fields = getUniqueTargetFields(error);

      if (fields.includes("email")) {
        return {
          success: false,
          code: "EMAIL_TAKEN",
          message: "邮箱已被使用",
        };
      }

      return {
        success: false,
        code: "USERNAME_TAKEN",
        message: "用户名已存在",
      };
    }

    if (code === "P2025") {
      return USER_NOT_FOUND;
    }

    throw error;
  }
}

export async function resetUserPassword(
  id: string,
  password: string
): Promise<UserOperationResult> {
  await requirePagePermission("user.resetPassword");

  const user = await db.user.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!user) {
    return USER_NOT_FOUND;
  }

  const passwordHash = await hashPassword(password);

  const credentialAccount = await db.account.findFirst({
    where: {
      userId: id,
      providerId: "credential",
    },
    select: { id: true },
  });

  if (credentialAccount) {
    await db.account.update({
      where: { id: credentialAccount.id },
      data: { password: passwordHash },
    });
  } else {
    await db.account.create({
      data: {
        id: crypto.randomUUID(),
        accountId: id,
        providerId: "credential",
        userId: id,
        password: passwordHash,
      },
    });
  }

  return {
    success: true,
  };
}

export async function setUserStatus(
  id: string,
  status: UserStatus
): Promise<UserOperationResult> {
  await requirePagePermission("user.disable");

  try {
    await db.user.update({
      where: { id },
      data: { status },
      select: { id: true },
    });

    if (status === "DISABLED") {
      // 停用后立即撤销该用户已有会话，不必等 Cookie 过期
      await db.session.deleteMany({ where: { userId: id } });
    }

    return {
      success: true,
    };
  } catch (error) {
    if (getErrorCode(error) === "P2025") {
      return USER_NOT_FOUND;
    }

    throw error;
  }
}

export async function deleteUser(
  id: string
): Promise<UserOperationResult> {
  await requirePagePermission("user.delete");

  try {
    await db.user.delete({
      where: { id },
      select: { id: true },
    });

    return {
      success: true,
    };
  } catch (error) {
    const code = getErrorCode(error);

    if (code === "P2025") {
      return USER_NOT_FOUND;
    }

    if (code === "P2003") {
      return USER_HAS_RELATIONS;
    }

    throw error;
  }
}
