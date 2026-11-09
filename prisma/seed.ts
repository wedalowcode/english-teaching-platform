import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import * as argon2 from "argon2";

import { PrismaClient, UserStatus } from "../app/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL 环境变量未配置");
}

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

// 与 lib/password.ts 保持一致，Argon2id 参数变更时两处同步
function hashPassword(password: string) {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

async function seedDemoUsers() {
  const now = Date.now();

  const users = Array.from({ length: 25 }, (_, i) => {
    const n = String(i + 1).padStart(2, "0");

    return {
      id: crypto.randomUUID(),
      name: `演示用户 ${n}`,
      email: `demo_user_${n}@qihang.local`,
      username: `demo_user_${n}`,
      phone: `138000000${n}`,
      status: (i + 1) % 5 === 0 ? UserStatus.DISABLED : UserStatus.ACTIVE,
      createdAt: new Date(now - i * 60 * 60 * 1000),
    };
  });

  const result = await db.user.createMany({
    data: users,
    skipDuplicates: true,
  });

  console.log(`已写入 ${result.count} 条演示用户`);
}

async function seedInitialAdmin() {
  const name = process.env.INIT_ADMIN_NAME;
  const email = process.env.INIT_ADMIN_EMAIL;
  const username = process.env.INIT_ADMIN_USERNAME;
  const password = process.env.INIT_ADMIN_PASSWORD;

  if (!name || !email || !username || !password) {
    console.log("未配置 INIT_ADMIN_* 环境变量，跳过初始管理员创建");
    return;
  }

  const existing = await db.user.findFirst({
    where: {
      OR: [{ username }, { email }],
    },
    select: { id: true },
  });

  if (existing) {
    console.log(`管理员 ${username} 已存在，跳过创建`);
    return;
  }

  const userId = crypto.randomUUID();
  const passwordHash = await hashPassword(password);

  await db.user.create({
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

  console.log(`已创建初始管理员 ${username}`);
}

async function main() {
  await seedDemoUsers();
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
