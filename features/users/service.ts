import "server-only";

import { db } from "@/lib/db";
import type { Prisma, UserStatus } from "@/app/generated/prisma/client";
import { hashPassword } from "@/lib/password";
import type { CreateUserInput, UpdateUserInput } from "./schemas";
type UserListParams = {
  page: number;
  pageSize: number;
  keyword: string;
};

export type UserOperationResult =
  | {
      success: true;
    }
  | {
      success: false;
      code: "NOT_FOUND" | "USERNAME_TAKEN" | "CONFLICT";
      message: string;
    };

function getErrorCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;

    return typeof code === "string" ? code : undefined;
  }

  return undefined;
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
  const { pageSize, keyword } = params;

  const where: Prisma.UserWhereInput = keyword
    ? {
        OR: [
          { username: { contains: keyword, mode: "insensitive" } },
          { phone: { contains: keyword } },
        ],
      }
    : {};

  const total = await db.user.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, params.page), totalPages);

  const items = await db.user.findMany({
    where,
    select: {
      id: true,
      username: true,
      phone: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { items, total, page, pageSize, totalPages };
}

export async function createUser(input: CreateUserInput) {
  const passwordHash = await hashPassword(input.password);

  try {
    return await db.user.create({
      data: {
        username: input.username,
        phone: input.phone,
        passwordHash,
      },
      select: { id: true },
    });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      const target =
        "meta" in error &&
        error.meta &&
        typeof error.meta === "object" &&
        "target" in error.meta
          ? error.meta.target
          : undefined;

      const fields = Array.isArray(target)
        ? target
        : typeof target === "string"
          ? [target]
          : [];

      if (fields.includes("username")) {
        throw new Error("用户名已存在");
      }
    }

    throw error;
  }
}

export async function getUserById(id: string) {
  return db.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      phone: true,
    },
  });
}

export async function updateUser(
  id: string,
  input: UpdateUserInput
): Promise<UserOperationResult> {
  try {
    await db.user.update({
      where: { id },
      data: {
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
  const passwordHash = await hashPassword(password);

  try {
    await db.user.update({
      where: { id },
      data: {
        passwordHash,
      },
      select: {
        id: true,
      },
    });

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

export async function setUserStatus(
  id: string,
  status: UserStatus
): Promise<UserOperationResult> {
  try {
    await db.user.update({
      where: { id },
      data: { status },
      select: { id: true },
    });

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