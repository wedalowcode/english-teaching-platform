import { describe, expect, it, vi } from "vitest";

import { DataScope } from "@/app/generated/prisma/client";

import { getPortalDestination } from "./portal-routing";
import { PERMISSIONS } from "./permissions";

import type { CurrentActor } from "./authorization";
import type { PermissionCode } from "./permissions";

vi.mock("server-only", () => ({}));
vi.mock("./current-actor", () => ({ getCurrentActor: vi.fn() }));

function createActor(permissionCodes: PermissionCode[]): CurrentActor {
  return {
    userId: "user-1",
    name: "测试用户",
    email: "user@example.com",
    isActive: true,
    roleCodes: [],
    activeRoleCodes: [],
    grants: permissionCodes.map((code) => ({
      permissionCode: code,
      scope: DataScope.ALL,
    })),
  };
}

describe("getPortalDestination", () => {
  it.each<{
    label: string;
    grants: PermissionCode[];
    expected: "/admin" | "/parent" | null;
  }>([
    {
      label: "只有后台入口",
      grants: ["portal.admin"],
      expected: "/admin",
    },
    {
      label: "只有家长端入口",
      grants: ["portal.parent"],
      expected: "/parent",
    },
    {
      label: "同时拥有两个入口",
      grants: ["portal.admin", "portal.parent"],
      expected: "/admin",
    },
    {
      label: "只有业务权限、没有入口权限",
      grants: ["student.view"],
      expected: null,
    },
    {
      label: "没有任何授权",
      grants: [],
      expected: null,
    },
  ])("$label 时分发到 $expected", ({ grants, expected }) => {
    expect(getPortalDestination(createActor(grants))).toBe(expected);
  });

  it("角色被停用后授权不再生效，无法进入任何门户", () => {
    // 停用账号在 getCurrentActor 阶段就不会产生 grants，
    // 这里直接模拟解析结果：角色编码存在，但没有有效授权。
    const actor: CurrentActor = {
      ...createActor([]),
      roleCodes: ["PARENT"],
      activeRoleCodes: [],
    };

    expect(getPortalDestination(actor)).toBeNull();
  });

  it("入口权限不支持数据范围，必须是 ALL", () => {
    expect(PERMISSIONS["portal.admin"].scopeable).toBe(false);
    expect(PERMISSIONS["portal.parent"].scopeable).toBe(false);
  });
});
