import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import * as argon2 from "argon2";

import { PrismaClient, UserStatus } from "../app/generated/prisma/client";
import { argon2Params } from "../lib/password-config";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL 环境变量未配置");
}

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

function hashPassword(password: string) {
  return argon2.hash(password, {
    type: argon2.argon2id,
    ...argon2Params,
  });
}

function requireEnv(key: string) {
  const value = process.env[key];

  if (!value) {
    throw new Error(`缺少环境变量 ${key}`);
  }

  return value;
}

async function requireSuperAdminRoleId() {
  const role = await db.role.findUnique({
    where: { code: "SUPER_ADMIN" },
    select: { id: true },
  });

  if (!role) {
    throw new Error("SUPER_ADMIN 角色不存在，请先执行 pnpm db:seed");
  }

  return role.id;
}

async function seedSuperAdmin() {
  /**
   * 超级管理员账号通过环境变量初始化，避免把账号密码写进代码仓库：
   * INITIAL_SUPER_ADMIN_EMAIL / INITIAL_SUPER_ADMIN_PASSWORD 必填，
   * INITIAL_SUPER_ADMIN_NAME / INITIAL_SUPER_ADMIN_USERNAME 可选。
   *
   * 密码使用与认证一致的 argon2 哈希处理，不明文写入 User 表。
   */
  const name =
    process.env.INITIAL_SUPER_ADMIN_NAME ?? "超级管理员";
  const email = requireEnv("INITIAL_SUPER_ADMIN_EMAIL").toLowerCase();
  const username = (
    process.env.INITIAL_SUPER_ADMIN_USERNAME ?? "superadmin"
  ).toLowerCase();
  const password = requireEnv("INITIAL_SUPER_ADMIN_PASSWORD");

  const existing = await db.user.findFirst({
    where: {
      OR: [{ username }, { email }],
    },
    select: { id: true },
  });

  if (existing) {
    // 已存在时确认 SUPER_ADMIN 角色，避免账号能登录却没有角色
    const superAdminRoleId = await requireSuperAdminRoleId();

    await db.userRole.upsert({
      where: {
        userId_roleId: {
          userId: existing.id,
          roleId: superAdminRoleId,
        },
      },
      update: {},
      create: {
        userId: existing.id,
        roleId: superAdminRoleId,
      },
    });

    console.log(`超级管理员 ${username} 已存在，已确认 SUPER_ADMIN 角色`);
    return;
  }

  const userId = crypto.randomUUID();
  const passwordHash = await hashPassword(password);

  await db.$transaction(async (tx) => {
    await tx.user.create({
      data: {
        id: userId,
        name,
        email,
        emailVerified: true,
        username,
        status: UserStatus.ACTIVE,

        accounts: {
          create: {
            id: crypto.randomUUID(),
            accountId: userId,
            providerId: "credential",
            password: passwordHash,
          },
        },
      },
    });

    const superAdminRole = await tx.role.findUnique({
      where: { code: "SUPER_ADMIN" },
      select: { id: true },
    });

    if (!superAdminRole) {
      throw new Error("SUPER_ADMIN 角色不存在，请先执行 pnpm db:seed");
    }

    await tx.userRole.create({
      data: {
        userId,
        roleId: superAdminRole.id,
      },
    });

    // 关键初始化动作记录审计日志
    await tx.auditLog.create({
      data: {
        actorUserId: userId,
        actorName: name,
        actorEmail: email,
        action: "SUPER_ADMIN_INIT",
        targetType: "User",
        targetId: userId,
      },
    });
  });

  console.log(`已创建超级管理员 ${username}`);
}

async function assertActiveSuperAdminExists() {
  const count = await db.userRole.count({
    where: {
      role: {
        code: "SUPER_ADMIN",
        isActive: true,
      },
      user: {
        status: UserStatus.ACTIVE,
      },
    },
  });

  if (count < 1) {
    throw new Error("初始化完成后必须至少保留一个有效超级管理员");
  }
}

async function main() {
  await seedSuperAdmin();
  await assertActiveSuperAdminExists();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
