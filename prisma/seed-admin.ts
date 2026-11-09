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

async function seedInitialAdmin() {
  const name = requireEnv("INIT_ADMIN_NAME");
  const email = requireEnv("INIT_ADMIN_EMAIL").toLowerCase();
  const username = requireEnv("INIT_ADMIN_USERNAME").toLowerCase();
  const password = requireEnv("INIT_ADMIN_PASSWORD");

  const existing = await db.user.findFirst({
    where: {
      OR: [{ username }, { email }],
    },
    select: { id: true },
  });

  if (existing) {
    // 管理员已存在时也要确认 ADMIN 角色，避免账号能登录却没有角色
    const adminRoleId = await requireAdminRoleId();

    await db.userRole.upsert({
      where: {
        userId_roleId: {
          userId: existing.id,
          roleId: adminRoleId,
        },
      },
      update: {},
      create: {
        userId: existing.id,
        roleId: adminRoleId,
      },
    });

    console.log(`管理员 ${username} 已存在，已确认 ADMIN 角色`);
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

    const adminRole = await tx.role.findUnique({
      where: { code: "ADMIN" },
      select: { id: true },
    });

    if (!adminRole) {
      throw new Error("ADMIN 角色不存在，请先执行 pnpm db:seed");
    }

    await tx.userRole.create({
      data: {
        userId,
        roleId: adminRole.id,
      },
    });
  });

  console.log(`已创建初始管理员 ${username}`);
}

async function requireAdminRoleId() {
  const role = await db.role.findUnique({
    where: { code: "ADMIN" },
    select: { id: true },
  });

  if (!role) {
    throw new Error("ADMIN 角色不存在，请先执行 pnpm db:seed");
  }

  return role.id;
}

async function main() {
  await seedInitialAdmin();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
