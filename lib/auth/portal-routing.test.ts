import { describe, expect, it, vi } from "vitest";

import { DataScope } from "@/app/generated/prisma/client";

import { getPortalDestination } from "./portal-routing";

import type { CurrentActor } from "./authorization";

vi.mock("server-only", () => ({}));
vi.mock("./current-actor", () => ({ getCurrentActor: vi.fn() }));

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

describe("getPortalDestination", () => {
  it("拥有后台入口权限进入统一后台", () => {
    const actor = createActor({
      grants: [
        { permissionCode: "portal.admin", scope: DataScope.ALL },
      ],
    });

    expect(getPortalDestination(actor)).toBe("/admin");
  });

  it("只有家长端入口权限进入家长端", () => {
    const actor = createActor({
      grants: [
        { permissionCode: "portal.parent", scope: DataScope.ALL },
      ],
    });

    expect(getPortalDestination(actor)).toBe("/parent");
  });

  it("同时拥有两个入口时优先进入统一后台", () => {
    const actor = createActor({
      grants: [
        { permissionCode: "portal.parent", scope: DataScope.ALL },
        { permissionCode: "portal.admin", scope: DataScope.ALL },
      ],
    });

    expect(getPortalDestination(actor)).toBe("/admin");
  });

  it("没有任何入口权限返回 null", () => {
    const actor = createActor({
      grants: [
        { permissionCode: "dashboard.view", scope: DataScope.ALL },
      ],
    });

    expect(getPortalDestination(actor)).toBeNull();
  });
});
