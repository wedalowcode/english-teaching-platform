import { beforeEach, describe, expect, it, vi } from "vitest";

import { DataScope } from "@/app/generated/prisma/client";

import {
  checkPermission,
  evaluatePermission,
} from "./authorization";

import type { CurrentActor } from "./authorization";
import type { PermissionCode } from "./permissions";

const { getCurrentActor } = vi.hoisted(() => ({
  getCurrentActor: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));
vi.mock("./current-actor", () => ({ getCurrentActor }));

function createActor(overrides: Partial<CurrentActor> = {}): CurrentActor {
  return {
    userId: "user-1",
    name: "测试用户",
    email: "user@example.com",
    isActive: true,
    roleCodes: [],
    activeRoleCodes: [],
    grants: [],
    ...overrides,
  };
}

beforeEach(() => {
  getCurrentActor.mockReset();
});

describe("checkPermission", () => {
  it("未登录返回 UNAUTHENTICATED", async () => {
    getCurrentActor.mockResolvedValue(null);

    const decision = await checkPermission("user.view");

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe("UNAUTHENTICATED");
    expect(decision.actor).toBeNull();
  });
});

describe("evaluatePermission：SYSTEM 权限", () => {
  it("有效 SUPER_ADMIN 直接获得 SYSTEM 权限，无需写入授权", () => {
    const actor = createActor({
      roleCodes: ["SUPER_ADMIN"],
      activeRoleCodes: ["SUPER_ADMIN"],
    });

    const decision = evaluatePermission("role.assignPermissions", actor);

    expect(decision.allowed).toBe(true);
  });

  it("普通 ADMIN 不自动获得 SYSTEM 权限", () => {
    const actor = createActor({
      roleCodes: ["ADMIN"],
      activeRoleCodes: ["ADMIN"],
    });

    const decision = evaluatePermission("role.assignPermissions", actor);

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe("FORBIDDEN");
  });

  it("SUPER_ADMIN 角色被禁用后不再产生超级管理员能力", () => {
    const actor = createActor({
      roleCodes: ["SUPER_ADMIN"],
      activeRoleCodes: [],
    });

    const decision = evaluatePermission("user.view", actor);

    expect(decision.allowed).toBe(false);
  });
});

describe("evaluatePermission：BUSINESS 权限", () => {
  it("SUPER_ADMIN 不自动获得 BUSINESS 权限", () => {
    const actor = createActor({
      roleCodes: ["SUPER_ADMIN"],
      activeRoleCodes: ["SUPER_ADMIN"],
    });

    const decision = evaluatePermission("student.view", actor);

    expect(decision.allowed).toBe(false);
  });

  it("拥有有效授权的角色可以访问业务权限", () => {
    const actor = createActor({
      activeRoleCodes: ["TEACHER"],
      grants: [
        { permissionCode: "student.view", scope: DataScope.ASSIGNED },
      ],
    });

    const decision = evaluatePermission("student.view", actor);

    expect(decision.allowed).toBe(true);
    expect(decision.scopes).toEqual([DataScope.ASSIGNED]);
  });

  it("多角色数据范围取逻辑并集", () => {
    const actor = createActor({
      activeRoleCodes: ["BOSS", "TEACHER"],
      grants: [
        { permissionCode: "student.view", scope: DataScope.OWN },
        { permissionCode: "student.view", scope: DataScope.ASSIGNED },
      ],
    });

    const decision = evaluatePermission("student.view", actor);

    expect(decision.allowed).toBe(true);
    expect(decision.scopes).toEqual(
      expect.arrayContaining([DataScope.OWN, DataScope.ASSIGNED])
    );
  });

  it("没有任何授权时拒绝访问，不默认放开", () => {
    const actor = createActor({ activeRoleCodes: ["TEACHER"] });

    const decision = evaluatePermission("dashboard.view", actor);

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe("FORBIDDEN");
  });

  it("未知权限编码拒绝访问", () => {
    const actor = createActor({ activeRoleCodes: ["SUPER_ADMIN"] });

    const decision = evaluatePermission(
      "student.xxx" as PermissionCode,
      actor
    );

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe("FORBIDDEN");
  });
});
