import "server-only";

import { db } from "@/lib/db";
import type { Prisma } from "@/app/generated/prisma/client";
import { hashPassword } from "@/lib/password";
import type { CreateUserInput, UpdateUserInput } from "./schemas";
type UserListParams = {
  page: number;
  pageSize: number;
  keyword: string;
};

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

type UpdateUserResult =
  | {
      success: true;
    }
  | {
      success: false;
      code: "USERNAME_TAKEN" | "NOT_FOUND";
      message: string;
    };

export async function updateUser(
  id: string,
  input: UpdateUserInput
): Promise<UpdateUserResult> {
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
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? error.code
        : undefined;

    if (code === "P2002") {
      return {
        success: false,
        code: "USERNAME_TAKEN",
        message: "用户名已存在",
      };
    }

    if (code === "P2025") {
      return {
        success: false,
        code: "NOT_FOUND",
        message: "用户不存在或已被删除",
      };
    }

    throw error;
  }
}

export async function resetUserPassword(id: string, password: string) {
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
      success: true as const,
    };
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? error.code
        : undefined;

    if (code === "P2025") {
      return {
        success: false as const,
        code: "NOT_FOUND" as const,
        message: "用户不存在或已被删除",
      };
    }

    throw error;
  }
}