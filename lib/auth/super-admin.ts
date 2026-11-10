import "server-only";

import {
  Prisma,
  UserStatus,
} from "@/app/generated/prisma/client";

import { db } from "@/lib/db";

import { SYSTEM_ROLE_CODES } from "./permissions";

export class LastSuperAdminError extends Error {
  constructor() {
    super("不能移除最后一个有效超级管理员");
    this.name = "LastSuperAdminError";
  }
}

/**
 * 有效超级管理员 = 有效用户 + 有效 SUPER_ADMIN 角色 + 角色关联。
 */
async function countActiveSuperAdmins(
  tx: Prisma.TransactionClient
) {
  return tx.userRole.count({
    where: {
      role: {
        code: SYSTEM_ROLE_CODES.SUPER_ADMIN,
        isActive: true,
      },

      user: {
        status: UserStatus.ACTIVE,
      },
    },
  });
}

function isSerializationConflict(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  );
}

/**
 * 超级管理员保护事务。
 *
 * 禁用/删除超级管理员用户、移除 SUPER_ADMIN 角色关联、
 * 禁用 SUPER_ADMIN 角色，都必须通过这个事务执行。
 *
 * 使用 Serializable 隔离级别避免并发请求同时移除不同的超级管理员，
 * 遇到序列化冲突最多重试三次。
 */
export async function withSuperAdminInvariant<T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await db.$transaction(
        async (tx) => {
          const result = await operation(tx);

          const count = await countActiveSuperAdmins(tx);

          if (count < 1) {
            throw new LastSuperAdminError();
          }

          return result;
        },
        {
          isolationLevel:
            Prisma.TransactionIsolationLevel.Serializable,
        }
      );
    } catch (error) {
      if (isSerializationConflict(error) && attempt < 2) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("超级管理员保护事务失败");
}
