import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCurrentUser, requireCurrentUser } from "./auth-session";

const { getSession, userFindUnique, redirect } = vi.hoisted(() => ({
  getSession: vi.fn(),
  userFindUnique: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession,
    },
  },
}));
vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: userFindUnique,
    },
  },
}));

const activeUser = {
  id: "user-1",
  name: "Alice",
  email: "alice@example.com",
  username: "alice",
  phone: null,
  status: "ACTIVE",
};

describe("getCurrentUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("没有会话时返回 null，且不查询用户表", async () => {
    getSession.mockResolvedValue(null);

    await expect(getCurrentUser()).resolves.toBeNull();
    expect(userFindUnique).not.toHaveBeenCalled();
  });

  it("会话存在但用户已被删除时返回 null", async () => {
    getSession.mockResolvedValue({ user: { id: "user-1" } });
    userFindUnique.mockResolvedValue(null);

    await expect(getCurrentUser()).resolves.toBeNull();

    expect(userFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "user-1" } })
    );
  });

  it("会话存在但账号已停用时返回 null", async () => {
    getSession.mockResolvedValue({ user: { id: "user-1" } });
    userFindUnique.mockResolvedValue({ ...activeUser, status: "DISABLED" });

    await expect(getCurrentUser()).resolves.toBeNull();
  });

  it("会话有效且账号正常时返回用户，且不返回凭证字段", async () => {
    getSession.mockResolvedValue({ user: { id: "user-1" } });
    userFindUnique.mockResolvedValue(activeUser);

    await expect(getCurrentUser()).resolves.toEqual(activeUser);

    const args = userFindUnique.mock.calls[0][0];

    expect(args.select).toEqual({
      id: true,
      name: true,
      email: true,
      username: true,
      phone: true,
      status: true,
    });
    expect(args.select).not.toHaveProperty("passwordHash");
  });
});

describe("requireCurrentUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("未登录时重定向到登录页", async () => {
    getSession.mockResolvedValue(null);

    await expect(requireCurrentUser()).rejects.toThrow("REDIRECT:/login");
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("已登录时返回用户", async () => {
    getSession.mockResolvedValue({ user: { id: "user-1" } });
    userFindUnique.mockResolvedValue(activeUser);

    await expect(requireCurrentUser()).resolves.toEqual(activeUser);
    expect(redirect).not.toHaveBeenCalled();
  });
});
