import "server-only";

import { APIError, createAuthMiddleware } from "better-auth/api";
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

      // 用户名作为登录标识，不允许随意修改
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

  // 在登录入口检查账号状态
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-in/username") {
        return;
      }

      const usernameValue = (ctx.body as { username?: unknown } | undefined)
        ?.username;

      if (typeof usernameValue !== "string") {
        return;
      }

      const user = await db.user.findUnique({
        where: {
          username: usernameValue.toLowerCase(),
        },
        select: {
          status: true,
        },
      });

      if (user?.status === "DISABLED") {
        throw new APIError("UNAUTHORIZED", {
          message: "账号已停用，请联系管理员",
        });
      }
    }),
  },
});
