import { beforeEach, describe, expect, it, vi } from "vitest";
import { createUser, getUserList } from "./service";

const { findMany, count, create, hashPassword } = vi.hoisted(() => ({
  findMany: vi.fn(),
  count: vi.fn(),
  create: vi.fn(),
  hashPassword: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({
  db: { user: { findMany, count, create } },
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

  it("有关键词时应按用户名或手机号搜索", async () => {
    await getUserList({ page: 1, pageSize: 10, keyword: "demo" });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { username: { contains: "demo", mode: "insensitive" } },
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
});

describe("createUser", () => {
  const input = {
    username: "alice",
    phone: null,
    password: "12345678",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    hashPassword.mockResolvedValue("hashed-password");
    create.mockResolvedValue({ id: "user-1" });
  });

  it("写入数据库的是哈希密码，不是明文", async () => {
    await createUser(input);

    expect(hashPassword).toHaveBeenCalledWith("12345678");
    expect(create).toHaveBeenCalledWith({
      data: {
        username: "alice",
        phone: null,
        passwordHash: "hashed-password",
      },
      select: { id: true },
    });
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

  it("冲突字段不是用户名时继续抛出原错误", async () => {
    const error = { code: "P2002", meta: { target: ["phone"] } };

    create.mockRejectedValue(error);

    await expect(createUser(input)).rejects.toBe(error);
  });

  it("其他数据库错误继续抛出", async () => {
    const error = new Error("connection lost");

    create.mockRejectedValue(error);

    await expect(createUser(input)).rejects.toBe(error);
  });

  it("不向调用方返回 passwordHash", async () => {
    const result = await createUser(input);

    expect(result).toEqual({ id: "user-1" });
  });
});
