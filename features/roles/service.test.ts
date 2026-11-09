import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  addUserToRole,
  getAvailableRoleUsers,
  getRoleUsers,
  removeUserFromRole,
} from "./service";

const {
  userCount,
  userFindMany,
  roleFindUnique,
  userRoleUpsert,
  userRoleDeleteMany,
  userFindUnique,
} = vi.hoisted(() => ({
  userCount: vi.fn(),
  userFindMany: vi.fn(),
  roleFindUnique: vi.fn(),
  userRoleUpsert: vi.fn(),
  userRoleDeleteMany: vi.fn(),
  userFindUnique: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({
  db: {
    user: {
      count: userCount,
      findMany: userFindMany,
      findUnique: userFindUnique,
    },
    role: {
      findUnique: roleFindUnique,
    },
    userRole: {
      upsert: userRoleUpsert,
      deleteMany: userRoleDeleteMany,
    },
  },
}));

describe("getRoleUsers", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    roleFindUnique.mockResolvedValue({
      id: "role-1",
      code: "TEACHER",
      name: "教师",
      description: null,
      isSystem: false,
      isActive: true,
    });

    userCount.mockResolvedValue(2);
    userFindMany.mockResolvedValue([]);
  });

  it("角色不存在时应返回 null", async () => {
    roleFindUnique.mockResolvedValue(null);

    const result = await getRoleUsers({
      roleId: "missing-role",
      page: 1,
      pageSize: 10,
      keyword: "",
    });

    expect(result).toBeNull();
    expect(userCount).not.toHaveBeenCalled();
  });

  it("应使用 some 条件查询已关联用户", async () => {
    await getRoleUsers({
      roleId: "role-1",
      page: 1,
      pageSize: 10,
      keyword: "",
    });

    expect(userCount).toHaveBeenCalledWith({
      where: {
        userRoles: {
          some: { roleId: "role-1" },
        },
      },
    });

    expect(userFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userRoles: {
            some: { roleId: "role-1" },
          },
        },
        skip: 0,
        take: 10,
      })
    );
  });

  it("有关键词时应按姓名、用户名或邮箱搜索", async () => {
    await getRoleUsers({
      roleId: "role-1",
      page: 1,
      pageSize: 10,
      keyword: "demo",
    });

    const where = userFindMany.mock.calls[0][0].where;

    expect(where.userRoles).toEqual({ some: { roleId: "role-1" } });
    expect(where.OR).toEqual([
      { name: { contains: "demo", mode: "insensitive" } },
      { username: { contains: "demo", mode: "insensitive" } },
      { email: { contains: "demo", mode: "insensitive" } },
    ]);
  });

  it("页码超出范围时应限制到最后一页", async () => {
    const result = await getRoleUsers({
      roleId: "role-1",
      page: 99,
      pageSize: 10,
      keyword: "",
    });

    expect(result).toEqual(
      expect.objectContaining({
        total: 2,
        page: 1,
        totalPages: 1,
      })
    );
  });

  it("返回结果应包含角色信息", async () => {
    const result = await getRoleUsers({
      roleId: "role-1",
      page: 1,
      pageSize: 10,
      keyword: "",
    });

    expect(result).toEqual(
      expect.objectContaining({
        role: expect.objectContaining({ code: "TEACHER" }),
      })
    );
  });
});

describe("getAvailableRoleUsers", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    userCount.mockResolvedValue(0);
    userFindMany.mockResolvedValue([]);
  });

  it("应使用 none 条件查询未关联用户", async () => {
    await getAvailableRoleUsers({
      roleId: "role-1",
      page: 1,
      pageSize: 10,
      keyword: "",
    });

    expect(userFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userRoles: {
            none: { roleId: "role-1" },
          },
        },
        skip: 0,
        take: 10,
      })
    );
  });

  it("候选用户不应返回密码等敏感字段", async () => {
    await getAvailableRoleUsers({
      roleId: "role-1",
      page: 1,
      pageSize: 10,
      keyword: "",
    });

    const args = userFindMany.mock.calls[0][0];

    expect(args.select).toEqual({
      id: true,
      name: true,
      username: true,
      email: true,
    });
  });

  it("空结果时页码应回落到第 1 页", async () => {
    const result = await getAvailableRoleUsers({
      roleId: "role-1",
      page: 5,
      pageSize: 10,
      keyword: "",
    });

    expect(result).toEqual(
      expect.objectContaining({ page: 1, totalPages: 1, total: 0 })
    );
  });
});

describe("addUserToRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    roleFindUnique.mockResolvedValue({ id: "role-1" });
    userFindUnique.mockResolvedValue({ id: "user-1" });
    userRoleUpsert.mockResolvedValue({});
  });

  it("应使用复合唯一约束 upsert 关联", async () => {
    const result = await addUserToRole("role-1", "user-1");

    expect(result).toEqual({ success: true });

    expect(userRoleUpsert).toHaveBeenCalledWith({
      where: {
        userId_roleId: {
          userId: "user-1",
          roleId: "role-1",
        },
      },
      update: {},
      create: {
        userId: "user-1",
        roleId: "role-1",
      },
    });
  });

  it("角色或用户不存在时应返回失败", async () => {
    userFindUnique.mockResolvedValue(null);

    const result = await addUserToRole("role-1", "missing-user");

    expect(result).toEqual({
      success: false,
      message: "角色或用户不存在",
    });

    expect(userRoleUpsert).not.toHaveBeenCalled();
  });
});

describe("removeUserFromRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    userRoleDeleteMany.mockResolvedValue({ count: 1 });
  });

  it("应按角色和用户删除关联", async () => {
    const result = await removeUserFromRole("role-1", "user-1");

    expect(result).toEqual({ success: true });

    expect(userRoleDeleteMany).toHaveBeenCalledWith({
      where: {
        roleId: "role-1",
        userId: "user-1",
      },
    });
  });

  it("关联不存在时也应返回成功", async () => {
    userRoleDeleteMany.mockResolvedValue({ count: 0 });

    const result = await removeUserFromRole("role-1", "user-1");

    expect(result).toEqual({ success: true });
  });
});
