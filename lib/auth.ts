import "server-only";

import { APIError } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins";

import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),

  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,

  emailAndPassword: {
    enabled: true,

    // 本项目不开放用户自行注册，账号由管理员创建
    disableSignUp: true,

    password: {
      hash: hashPassword,

      verify: ({ password, hash }) => {
        return verifyPassword(password, hash);
      },
    },
  },

  plugins: [
    username({
      minUsernameLength: 3,
      maxUsernameLength: 30,

      // 不需要额外保存 displayUsername
      displayUsername: false,

      // 只拦截 update-user 接口的改名请求，管理员通过 Prisma 直接改不受影响
      immutableUsername: true,
    }),
  ],

  user: {
    additionalFields: {
      phone: {
        type: "string",
        required: false,
        input: false,
      },

      status: {
        type: ["ACTIVE", "DISABLED"],
        required: true,
        defaultValue: "ACTIVE",
        input: false,
      },
    },
  },

  databaseHooks: {
    session: {
      create: {
        // 创建会话（即登录成功的最后一步）之前检查账号状态。
        // 这里已经通过密码校验，只会在账号本人登录时才返回停用提示，
        // 不会把「账号存在且已停用」泄露给猜用户名的人。
        before: async (session) => {
          const user = await db.user.findUnique({
            where: {
              id: session.userId,
            },
            select: {
              status: true,
            },
          });

          if (!user) {
            throw new APIError("UNAUTHORIZED", {
              message: "账号不存在，请联系管理员",
            });
          }

          if (user.status === "DISABLED") {
            throw new APIError("UNAUTHORIZED", {
              message: "账号已停用，请联系管理员",
            });
          }
        },
      },
    },
  },
});
