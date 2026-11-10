import { describe, expect, it, vi } from "vitest";

import { DataScope } from "@/app/generated/prisma/client";

vi.mock("server-only", () => ({}));

import {
  assertDefaultRoleGrants,
  DEFAULT_ROLE_GRANTS,
} from "./default-role-grants";
import { validatePermissionScope } from "./permission-service";
import { PERMISSIONS } from "./permissions";

import type { PermissionCode } from "./permissions";

const permissionCodes = Object.keys(PERMISSIONS) as PermissionCode[];

describe("权限目录", () => {
  it("权限编码统一使用「资源.动作」两段式格式", () => {
    for (const code of permissionCodes) {
      expect(code).toMatch(/^[a-z][a-zA-Z]*\.[a-z][a-zA-Z]*$/);
    }
  });

  it("SYSTEM 权限不允许通过 RolePermission 授权", () => {
    const systemCodes: PermissionCode[] = [
      "user.view",
      "role.view",
      "permission.view",
      "role.assignPermissions",
    ];

    for (const code of systemCodes) {
      expect(PERMISSIONS[code].domain).toBe("SYSTEM");
      expect(PERMISSIONS[code].grantable).toBe(false);
    }
  });

  it("入口权限属于 BUSINESS 域且必须明确授权", () => {
    expect(PERMISSIONS["portal.admin"].domain).toBe("BUSINESS");
    expect(PERMISSIONS["portal.admin"].grantable).toBe(true);
    expect(PERMISSIONS["portal.parent"].domain).toBe("BUSINESS");
    expect(PERMISSIONS["portal.parent"].grantable).toBe(true);
  });

  it("createScopes 引用的权限必须存在且允许授权", () => {
    for (const code of permissionCodes) {
      const definition = PERMISSIONS[code];

      for (const dependency of definition.createScopes ?? []) {
        expect(PERMISSIONS[dependency.permission]).toBeDefined();
        expect(
          PERMISSIONS[dependency.permission].grantable
        ).toBe(true);
      }
    }
  });
});

describe("validatePermissionScope", () => {
  it("未知权限直接拒绝", () => {
    expect(() =>
      validatePermissionScope(
        "student.xxx" as PermissionCode,
        DataScope.ALL
      )
    ).toThrow("未知权限");
  });

  it("无效数据范围直接拒绝", () => {
    expect(() =>
      validatePermissionScope(
        "student.view",
        "DEPARTMENT" as DataScope
      )
    ).toThrow("无效的数据范围");
  });

  it("不支持数据范围的权限只能使用 ALL", () => {
    expect(() =>
      validatePermissionScope("portal.admin", DataScope.OWN)
    ).toThrow("该权限不支持配置数据范围");

    expect(() =>
      validatePermissionScope("portal.admin", DataScope.ALL)
    ).not.toThrow();
  });

  it("支持数据范围的权限可以使用 OWN 和 ASSIGNED", () => {
    expect(() =>
      validatePermissionScope("student.view", DataScope.OWN)
    ).not.toThrow();
    expect(() =>
      validatePermissionScope("student.view", DataScope.ASSIGNED)
    ).not.toThrow();
  });
});

describe("DEFAULT_ROLE_GRANTS", () => {
  it("默认授权全部通过权限目录校验", () => {
    expect(() => assertDefaultRoleGrants()).not.toThrow();
  });

  it("SYSTEM 权限不能写入 RolePermission", () => {
    expect(() =>
      assertDefaultRoleGrants([
        {
          roleCode: "ADMIN",
          permissionCode: "user.view",
          scope: DataScope.ALL,
        },
      ])
    ).toThrow("权限不允许写入 RolePermission");
  });

  it("SUPER_ADMIN 只获得入口权限，SYSTEM 权限不写入", () => {
    const superAdminGrants = DEFAULT_ROLE_GRANTS.filter(
      (grant) => grant.roleCode === "SUPER_ADMIN"
    );

    expect(superAdminGrants).toEqual([
      {
        roleCode: "SUPER_ADMIN",
        permissionCode: "portal.admin",
        scope: DataScope.ALL,
      },
    ]);
  });
});
