import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteUserAction,
  setUserStatusAction,
} from "./actions";
import type { UserActionResult } from "./actions";

const { requireUserAdmin, revalidatePath, setUserStatus, deleteUser } =
  vi.hoisted(() => ({
    requireUserAdmin: vi.fn(),
    revalidatePath: vi.fn(),
    setUserStatus: vi.fn(),
    deleteUser: vi.fn(),
  }));

vi.mock("@/lib/auth/authorization", () => ({
  requirePagePermission: requireUserAdmin,
}));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("./service", () => ({
  createUser: vi.fn(),
  updateUser: vi.fn(),
  resetUserPassword: vi.fn(),
  setUserStatus,
  deleteUser,
}));

describe("setUserStatusAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireUserAdmin.mockResolvedValue(undefined);
    setUserStatus.mockResolvedValue({ success: true });
  });

  it("应调用 Service 并刷新用户列表", async () => {
    const result = await setUserStatusAction("user-1", "DISABLED");

    expect(requireUserAdmin).toHaveBeenCalled();

    expect(setUserStatus).toHaveBeenCalledWith(
      "user-1",
      "DISABLED"
    );

    expect(revalidatePath).toHaveBeenCalledWith("/admin/users");

    expect(result).toEqual({ success: true });
  });

  it("非法状态应直接返回失败结果，不调用 Service", async () => {
    const result = await setUserStatusAction(
      "user-1",
      "UNKNOWN" as never
    );

    expect(setUserStatus).not.toHaveBeenCalled();

    expect(result).toEqual({
      success: false,
      message: "无效的用户状态",
    });
  });

  it("Service 返回失败时应把原因传给调用方", async () => {
    setUserStatus.mockResolvedValue({
      success: false,
      code: "NOT_FOUND",
      message: "用户不存在或已被删除",
    });

    const result = await setUserStatusAction("user-1", "DISABLED");

    expect(revalidatePath).toHaveBeenCalledWith("/admin/users");

    expect(result).toEqual({
      success: false,
      message: "用户不存在或已被删除",
    });
  });

  it("非管理员调用时应被拒绝", async () => {
    requireUserAdmin.mockRejectedValue(new Error("无权访问"));

    await expect(
      setUserStatusAction("user-1", "DISABLED")
    ).rejects.toThrow("无权访问");

    expect(setUserStatus).not.toHaveBeenCalled();
  });
});

describe("deleteUserAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireUserAdmin.mockResolvedValue(undefined);
  });

  it("删除成功时刷新列表并返回成功", async () => {
    deleteUser.mockResolvedValue({ success: true });

    const result: UserActionResult = await deleteUserAction("user-1");

    expect(deleteUser).toHaveBeenCalledWith("user-1");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/users");
    expect(result).toEqual({ success: true });
  });

  it("删除失败时返回业务原因", async () => {
    deleteUser.mockResolvedValue({
      success: false,
      code: "CONFLICT",
      message: "该用户存在关联数据，无法删除，请改为停用",
    });

    const result = await deleteUserAction("user-1");

    expect(revalidatePath).toHaveBeenCalledWith("/admin/users");

    expect(result).toEqual({
      success: false,
      message: "该用户存在关联数据，无法删除，请改为停用",
    });
  });
});
