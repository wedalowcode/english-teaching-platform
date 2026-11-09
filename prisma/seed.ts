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
  console.log("演示用户仅用于列表、搜索和分页，不创建登录凭证");
}

async function seedRoles() {
  /**
   * 内置角色由系统预置，业务代码依赖其 code，不允许删除。
   * sort 只决定列表里的展示顺序。
   */
  const roles = [
    {
      code: "BOSS",
      name: "老板",
      description: "查看经营数据与整体运营情况",
      sort: 10,
    },
    {
      code: "ACADEMIC",
      name: "教务人员",
      description: "负责学生、课程和教学安排",
      sort: 20,
    },
    {
      code: "ADMIN",
      name: "系统管理员",
      description: "负责系统配置、用户和权限管理",
      sort: 30,
    },
    {
      code: "TEACHER",
      name: "教师",
      description: "负责学生授课和学习记录",
      sort: 40,
    },
    {
      code: "PARENT",
      name: "家长",
      description: "查看学生学习情况和课程报告",
      sort: 50,
    },
    {
      code: "AGENT",
      name: "代理",
      description: "负责招生渠道与代理合作",
      sort: 60,
    },
  ];

  for (const role of roles) {
    await db.role.upsert({
      where: {
        code: role.code,
      },
      // 只同步系统维护的字段，不覆盖管理员后续修改的名称和说明
      update: {
        isSystem: true,
        sort: role.sort,
      },
      create: {
        ...role,
        isSystem: true,
      },
    });
  }

  console.log(`已初始化 ${roles.length} 个内置角色`);
}

async function seedDemoUserRoles() {
  const users = await db.user.findMany({
    where: {
      username: {
        startsWith: "demo_user_",
        mode: "insensitive",
      },
    },
    select: {
      id: true,
    },
    orderBy: {
      username: "asc",
    },
  });

  const roleCodes = ["TEACHER", "PARENT", "ACADEMIC", "AGENT"] as const;

  const roles = await db.role.findMany({
    where: {
      code: {
        in: [...roleCodes],
      },
    },
    select: {
      id: true,
      code: true,
    },
  });

  const roleMap = new Map(
    roles.map((role) => [role.code, role.id])
  );

  const data = users.flatMap((user, index) => {
    const roleCode = roleCodes[index % roleCodes.length];
    const roleId = roleMap.get(roleCode);

    return roleId
      ? [{ userId: user.id, roleId }]
      : [];
  });

  const result = await db.userRole.createMany({
    data,
    skipDuplicates: true,
  });

  console.log(`已建立 ${result.count} 条演示用户角色关联`);
}

async function main() {
  await seedDemoUsers();
  await seedRoles();
  await seedDemoUserRoles();

  console.log("初始管理员请单独运行 pnpm db:seed:admin");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
