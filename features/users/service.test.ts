import { beforeEach, describe, expect, it, vi } from "vitest";

const { findMany, count } = vi.hoisted(() => ({
  findMany: vi.fn(),
  count: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({
  db: { user: { findMany, count } },
}));

import { getUserList } from "./service";

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
      expect.objectContaining({ skip: 10, take: 10 }),
    );
  });

  it("页码超出范围时应限制到最后一页", async () => {
    const result = await getUserList({ page: 99, pageSize: 10, keyword: "" });

    expect(result.page).toBe(3);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 }),
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
      }),
    );
  });

  it("没有关键词时不应附加搜索条件", async () => {
    await getUserList({ page: 1, pageSize: 10, keyword: "" });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });

  it("应使用稳定的排序，并且不返回密码哈希", async () => {
    await getUserList({ page: 1, pageSize: 10, keyword: "" });

    const args = findMany.mock.calls[0][0];

    expect(args.orderBy).toEqual([{ createdAt: "desc" }, { id: "desc" }]);
    expect(args.select).not.toHaveProperty("passwordHash");
  });
});
