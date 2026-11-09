import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createUser,
  deleteUser,
  getUserById,
  getUserList,
  getRoleOptions,
  resetUserPassword,
  setUserStatus,
  updateUser,
  updateUserRoles,
} from "./service";

const {
  findMany,
  count,
  create,
  update,
  findUnique,
  deleteUserMock,
  hashPassword,
  accountFindFirst,
  accountUpdate,
  accountCreate,
  transaction,
  roleFindMany,
  userRoleDeleteMany,
  userRoleCreateMany,
} = vi.hoisted(() => ({
  findMany: vi.fn(),
  count: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  findUnique: vi.fn(),
  deleteUserMock: vi.fn(),
  hashPassword: vi.fn(),
  accountFindFirst: vi.fn(),
  accountUpdate: vi.fn(),
  accountCreate: vi.fn(),
  transaction: vi.fn(),
  roleFindMany: vi.fn(),
  userRoleDeleteMany: vi.fn(),
  userRoleCreateMany: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findMany,
      count,
      create,
      update,
      findUnique,
      delete: deleteUserMock,
    },
    account: {
      findFirst: accountFindFirst,
      update: accountUpdate,
      create: accountCreate,
    },
    role: {
      findMany: roleFindMany,
    },
    userRole: {
      deleteMany: userRoleDeleteMany,
      createMany: userRoleCreateMany,
    },
    $transaction: transaction,
  },
}));
vi.mock("@/lib/password", () => ({ hashPassword }));

describe("getUserList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    count.mockResolvedValue(25);
    findMany.mockResolvedValue([]);
  });

  it("应正确计算分页", async () => {
    const result = await getUserList({ page: 2, pageSize: 10, keyword: "" });

    expect(result.total).toBe(25);
    expect(result.totalPages).toBe(3);
    expect(result.page).toBe(2);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 })
    );
  });

  it("页码超出范围时应限制到最后一页", async () => {
    const result = await getUserList({ page: 99, pageSize: 10, keyword: "" });

    expect(result.page).toBe(3);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 })
    );
  });

  it("有关键词时应按姓名、用户名、邮箱或手机号搜索", async () => {
    await getUserList({ page: 1, pageSize: 10, keyword: "demo" });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { name: { contains: "demo", mode: "insensitive" } },
            { username: { contains: "demo", mode: "insensitive" } },
            { email: { contains: "demo", mode: "insensitive" } },
            { phone: { contains: "demo" } },
          ],
        },
      })
    );
  });

  it("没有关键词时不应附加搜索条件", async () => {
    await getUserList({ page: 1, pageSize: 10, keyword: "" });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    );
  });

  it("应使用稳定的排序，并且不返回密码哈希", async () => {
    await getUserList({ page: 1, pageSize: 10, keyword: "" });

    const args = findMany.mock.calls[0][0];

    expect(args.orderBy).toEqual([{ createdAt: "desc" }, { id: "desc" }]);
    expect(args.select).not.toHaveProperty("passwordHash");
  });

  it("列表查询应包含姓名、邮箱和更新时间", async () => {
    await getUserList({ page: 1, pageSize: 10, keyword: "" });

    const args = findMany.mock.calls[0][0];

    expect(args.select).toEqual({
      id: true,
      name: true,
      email: true,
      username: true,
      phone: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      userRoles: {
        select: {
          roleId: true,
        },
      },
    });
  });
});

describe("createUser", () => {
  const input = {
    name: "Alice",
    email: "alice@example.com",
    username: "alice",
    phone: null,
    password: "Learn@2026",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    hashPassword.mockResolvedValue("hashed-password");
    create.mockResolvedValue({ id: "user-1" });
  });

  it("同时创建用户和 credential 账号，写入哈希密码", async () => {
    await createUser(input);

    expect(hashPassword).toHaveBeenCalledWith("Learn@2026");

    const args = create.mock.calls[0][0];

    expect(args.data).toEqual(
      expect.objectContaining({
        name: "Alice",
        email: "alice@example.com",
        username: "alice",
        phone: null,
      })
    );

    expect(args.data.accounts.create).toEqual(
      expect.objectContaining({
        providerId: "credential",
        password: "hashed-password",
      })
    );

    expect(args.select).toEqual({ id: true });
  });

  it("账号 accountId 应指向新建用户 ID", async () => {
    await createUser(input);

    const args = create.mock.calls[0][0];

    expect(args.data.accounts.create.accountId).toBe(args.data.id);
  });

  it("空手机号以 null 写入", async () => {
    await createUser(input);

    const args = create.mock.calls[0][0];

    expect(args.data.phone).toBeNull();
  });

  it("有手机号时原样保存", async () => {
    await createUser({ ...input, phone: "13800138000" });

    const args = create.mock.calls[0][0];

    expect(args.data.phone).toBe("13800138000");
  });

  it("用户名唯一冲突时提示用户名已存在", async () => {
    create.mockRejectedValue({
      code: "P2002",
      meta: { target: ["username"] },
    });

    await expect(createUser(input)).rejects.toThrow("用户名已存在");
  });

  it("邮箱唯一冲突时提示邮箱已被使用", async () => {
    create.mockRejectedValue({
      code: "P2002",
      meta: { target: ["email"] },
    });

    await expect(createUser(input)).rejects.toThrow("邮箱已被使用");
  });

  it("其他数据库错误继续抛出", async () => {
    const error = new Error("connection lost");

    create.mockRejectedValue(error);

    await expect(createUser(input)).rejects.toBe(error);
  });

  it("不向调用方返回密码哈希", async () => {
    const result = await createUser(input);

    expect(result).toEqual({ id: "user-1" });
  });
});

describe("updateUser", () => {
  const input = {
    name: "Alice",
    email: "alice@example.com",
    username: "alice",
    phone: "13800138000",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    update.mockResolvedValue({ id: "user-1" });
  });

  it("应正确更新姓名、邮箱、用户名和手机号", async () => {
    const result = await updateUser("user-1", input);

    expect(result).toEqual({ success: true });

    expect(update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        name: "Alice",
        email: "alice@example.com",
        username: "alice",
        phone: "13800138000",
      },
      select: { id: true },
    });
  });

  it("用户名重复时应返回明确的业务错误", async () => {
    update.mockRejectedValue({
      code: "P2002",
      meta: {
        target: "User_username_key",
      },
    });

    const result = await updateUser("user-1", input);

    expect(result).toEqual({
      success: false,
      code: "USERNAME_TAKEN",
      message: "用户名已存在",
    });
  });

  it("邮箱重复时应返回 EMAIL_TAKEN", async () => {
    update.mockRejectedValue({
      code: "P2002",
      meta: {
        target: ["email"],
      },
    });

    const result = await updateUser("user-1", input);

    expect(result).toEqual({
      success: false,
      code: "EMAIL_TAKEN",
      message: "邮箱已被使用",
    });
  });

  it("用户不存在时应返回 NOT_FOUND", async () => {
    update.mockRejectedValue({
      code: "P2025",
    });

    const result = await updateUser("missing-user", input);

    expect(result).toEqual({
      success: false,
      code: "NOT_FOUND",
      message: "用户不存在或已被删除",
    });
  });

  it("其他数据库异常应继续向上抛出", async () => {
    const error = new Error("connection lost");

    update.mockRejectedValue(error);

    await expect(updateUser("user-1", input)).rejects.toBe(error);
  });
});

describe("resetUserPassword", () => {
  const newPassword = "Learn@2026";

  beforeEach(() => {
    vi.clearAllMocks();

    hashPassword.mockResolvedValue("hashed-password");

    findUnique.mockResolvedValue({ id: "user-1" });

    accountFindFirst.mockResolvedValue({ id: "account-1" });

    accountUpdate.mockResolvedValue({ id: "account-1" });
  });

  it("应使用哈希密码更新 credential 账号", async () => {
    const result = await resetUserPassword("user-1", newPassword);

    expect(hashPassword).toHaveBeenCalledWith(newPassword);

    expect(accountFindFirst).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        providerId: "credential",
      },
      select: { id: true },
    });

    expect(accountUpdate).toHaveBeenCalledWith({
      where: { id: "account-1" },
      data: { password: "hashed-password" },
    });

    expect(result).toEqual({
      success: true,
    });
  });

  it("账号不存在时应补建 credential 账号", async () => {
    accountFindFirst.mockResolvedValue(null);

    const result = await resetUserPassword("user-1", newPassword);

    expect(accountCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        accountId: "user-1",
        providerId: "credential",
        userId: "user-1",
        password: "hashed-password",
      }),
    });

    expect(result).toEqual({
      success: true,
    });
  });

  it("用户不存在时应返回 NOT_FOUND", async () => {
    findUnique.mockResolvedValue(null);

    const result = await resetUserPassword("missing-user", newPassword);

    expect(result).toEqual({
      success: false,
      code: "NOT_FOUND",
      message: "用户不存在或已被删除",
    });
  });

  it("传给数据库的参数中不应出现明文密码", async () => {
    await resetUserPassword("user-1", newPassword);

    expect(JSON.stringify(accountUpdate.mock.calls)).not.toContain(
      newPassword
    );
  });
});

describe("getUserById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("查询用户时不应返回密码哈希", async () => {
    findUnique.mockResolvedValue({
      id: "user-1",
      name: "Alice",
      email: "alice@example.com",
      username: "alice",
      phone: null,
    });

    await getUserById("user-1");

    const args = findUnique.mock.calls[0][0];

    expect(args).toEqual({
      where: { id: "user-1" },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        phone: true,
      },
    });

    expect(args.select).not.toHaveProperty("passwordHash");
  });
});

describe("setUserStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    update.mockResolvedValue({
      id: "user-1",
    });
  });

  it.each(["ACTIVE", "DISABLED"] as const)(
    "应将用户状态修改为 %s",
    async (status) => {
      const result = await setUserStatus("user-1", status);

      expect(update).toHaveBeenCalledWith({
        where: {
          id: "user-1",
        },
        data: {
          status,
        },
        select: {
          id: true,
        },
      });

      expect(result).toEqual({
        success: true,
      });
    }
  );

  it("用户不存在时应返回 NOT_FOUND", async () => {
    update.mockRejectedValue({
      code: "P2025",
    });

    const result = await setUserStatus("missing-user", "DISABLED");

    expect(result).toEqual({
      success: false,
      code: "NOT_FOUND",
      message: "用户不存在或已被删除",
    });
  });

  it("其他数据库异常应继续抛出", async () => {
    const error = new Error("connection lost");

    update.mockRejectedValue(error);

    await expect(
      setUserStatus("user-1", "DISABLED")
    ).rejects.toBe(error);
  });
});

describe("deleteUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    deleteUserMock.mockResolvedValue({
      id: "user-1",
    });
  });

  it("应成功删除指定用户", async () => {
    const result = await deleteUser("user-1");

    expect(deleteUserMock).toHaveBeenCalledWith({
      where: {
        id: "user-1",
      },
      select: {
        id: true,
      },
    });

    expect(result).toEqual({
      success: true,
    });
  });

  it("用户不存在时应返回 NOT_FOUND", async () => {
    deleteUserMock.mockRejectedValue({
      code: "P2025",
    });

    const result = await deleteUser("missing-user");

    expect(result).toEqual({
      success: false,
      code: "NOT_FOUND",
      message: "用户不存在或已被删除",
    });
  });

  it("存在关联数据时应返回 CONFLICT", async () => {
    deleteUserMock.mockRejectedValue({
      code: "P2003",
    });

    const result = await deleteUser("user-1");

    expect(result).toEqual({
      success: false,
      code: "CONFLICT",
      message: "该用户存在关联数据，无法删除，请改为停用",
    });
  });

  it("其他数据库异常应继续抛出", async () => {
    const error = new Error("connection lost");

    deleteUserMock.mockRejectedValue(error);

    await expect(deleteUser("user-1")).rejects.toBe(error);
  });
});

describe("updateUserRoles", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback({
        user: { findUnique },
        role: { findMany: roleFindMany },
        userRole: {
          deleteMany: userRoleDeleteMany,
          createMany: userRoleCreateMany,
        },
      })
    );

    findUnique.mockResolvedValue({ id: "user-1" });

    roleFindMany.mockImplementation(async (args: {
      where?: { id?: { in?: string[] } };
    }) => {
      const allRoles = [{ id: "role-1" }, { id: "role-2" }];
      const inIds = args?.where?.id?.in;

      return inIds
        ? allRoles.filter((role) => inIds.includes(role.id))
        : allRoles;
    });
    userRoleDeleteMany.mockResolvedValue({ count: 0 });
    userRoleCreateMany.mockResolvedValue({ count: 2 });
  });

  it("应先删除旧关联再创建新关联", async () => {
    const result = await updateUserRoles("user-1", ["role-1", "role-2"]);

    expect(result).toEqual({ success: true });

    expect(userRoleDeleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
    });

    expect(userRoleCreateMany).toHaveBeenCalledWith({
      data: [
        { userId: "user-1", roleId: "role-1" },
        { userId: "user-1", roleId: "role-2" },
      ],
    });
  });

  it("重复角色应去重后写入", async () => {
    await updateUserRoles("user-1", ["role-1", "role-1"]);

    expect(userRoleCreateMany).toHaveBeenCalledWith({
      data: [{ userId: "user-1", roleId: "role-1" }],
    });
  });

  it("空数组应只删除旧关联，不创建新关联", async () => {
    const result = await updateUserRoles("user-1", []);

    expect(result).toEqual({ success: true });

    expect(userRoleDeleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
    });

    expect(userRoleCreateMany).not.toHaveBeenCalled();
  });

  it("用户不存在时应返回失败且不修改关联", async () => {
    findUnique.mockResolvedValue(null);

    const result = await updateUserRoles("missing-user", ["role-1"]);

    expect(result).toEqual({
      success: false,
      message: "用户不存在",
    });

    expect(userRoleDeleteMany).not.toHaveBeenCalled();
    expect(userRoleCreateMany).not.toHaveBeenCalled();
  });

  it("存在无效角色时应返回失败且不修改关联", async () => {
    roleFindMany.mockResolvedValue([{ id: "role-1" }]);

    const result = await updateUserRoles("user-1", ["role-1", "role-x"]);

    expect(result).toEqual({
      success: false,
      message: "存在无效角色",
    });

    expect(userRoleDeleteMany).not.toHaveBeenCalled();
    expect(userRoleCreateMany).not.toHaveBeenCalled();
  });
});

describe("getRoleOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    roleFindMany.mockResolvedValue([]);
  });

  it("应按系统角色优先、名称排序查询角色", async () => {
    await getRoleOptions();

    expect(roleFindMany).toHaveBeenCalledWith({
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
      },
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    });
  });
});
