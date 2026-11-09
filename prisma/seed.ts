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

async function seedRoles() {
  const roles = [
    {
      code: "ADMIN",
      name: "系统管理员",
      description: "负责系统配置、用户和权限管理",
      isSystem: true,
    },
    {
      code: "ACADEMIC",
      name: "教务人员",
      description: "负责学生、课程和教学安排",
      isSystem: false,
    },
    {
      code: "TEACHER",
      name: "教师",
      description: "负责学生授课和学习记录",
      isSystem: false,
    },
    {
      code: "PARENT",
      name: "家长",
      description: "查看学生学习情况和课程报告",
      isSystem: false,
    },
    {
      code: "COURSE_OPERATOR",
      name: "课程运营",
      description: "负责课程配置和课程内容维护",
      isSystem: false,
    },
    {
      code: "STUDENT_MANAGER",
      name: "学员管理员",
      description: "负责学员资料和学习档案管理",
      isSystem: false,
    },
  ];

  for (const role of roles) {
    await db.role.upsert({
      where: {
        code: role.code,
      },
      update: {
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
      },
      create: role,
    });
  }

  console.log(`已初始化 ${roles.length} 个系统角色`);
}

async function seedDemoUserRoles() {
  const users = await db.user.findMany({
    where: {
      username: {
        startsWith: "demo_user_",
      },
    },
    select: {
      id: true,
    },
    orderBy: {
      username: "asc",
    },
  });

  const roles = await db.role.findMany({
    where: {
      code: {
        in: ["TEACHER", "PARENT", "ACADEMIC"],
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

  const roleCodes = ["TEACHER", "PARENT", "ACADEMIC"];

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

async function seedAdminRole() {
  const username = process.env.INIT_ADMIN_USERNAME;

  if (!username) {
    return;
  }

  const [user, role] = await Promise.all([
    db.user.findUnique({
      where: { username },
      select: { id: true },
    }),

    db.role.findUnique({
      where: { code: "ADMIN" },
      select: { id: true },
    }),
  ]);

  if (!user || !role) {
    console.log("初始管理员或 ADMIN 角色不存在，跳过关联");
    return;
  }

  await db.userRole.createMany({
    data: [
      {
        userId: user.id,
        roleId: role.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log(`已为 ${username} 分配系统管理员角色`);
}

async function main() {
  await seedDemoUsers();
  await seedRoles();
  await seedDemoUserRoles();

  await seedInitialAdmin();
  await seedAdminRole();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
