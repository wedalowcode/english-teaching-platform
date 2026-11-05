import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, UserStatus } from "../app/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL 环境变量未配置");
}

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const now = Date.now();

  const users = Array.from({ length: 25 }, (_, i) => {
    const n = String(i + 1).padStart(2, "0");

    return {
      username: `Demo_User_${n}`,
      passwordHash: "seed-placeholder-not-a-real-hash",
      phone: `138000000${n}`,
      status: (i + 1) % 5 === 0 ? UserStatus.DISABLED : UserStatus.ACTIVE,
      createdAt: new Date(now - i * 60 * 60 * 1000),
    };
  });

  const result = await db.user.createMany({
    data: users,
    skipDuplicates: true,
  });

  console.log(`已写入 ${result.count} 条测试用户`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });