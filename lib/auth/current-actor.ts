import "server-only";

import { cache } from "react";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

import type { CurrentActor } from "./authorization";

/**
 * 解析当前登录用户上下文。
 *
 * 1. 身份只来自 Better Auth 会话，不接受客户端传入的用户 ID 或角色编码。
 * 2. 用户必须处于启用状态，禁用用户不能继续使用系统。
 * 3. 只有启用状态的角色才参与权限计算，禁用角色的授权立即失效。
 * 4. 用 React cache() 在同一次服务端请求中复用结果，
 *    不使用 Next.js 持久化缓存，避免权限变化后长时间不生效。
 */
export const getCurrentActor = cache(
  async (): Promise<CurrentActor | null> => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return null;
    }

    const user = await db.user.findUnique({
      where: {
        id: session.user.id,
      },

      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: true,
              },
            },
          },
        },
      },
    });

    if (!user || user.status !== "ACTIVE") {
      return null;
    }

    const activeUserRoles = user.userRoles.filter(
      (item) => item.role.isActive
    );

    const activeRoleCodes = activeUserRoles.map((item) => item.role.code);

    const grants = activeUserRoles.flatMap((item) =>
      item.role.rolePermissions.map((permission) => ({
        permissionCode: permission.permissionCode,
        scope: permission.scope,
      }))
    );

    return {
      userId: user.id,
      name: user.name,
      email: user.email,

      isActive: true,

      roleCodes: user.userRoles.map((item) => item.role.code),

      activeRoleCodes,

      grants,
    };
  }
);
