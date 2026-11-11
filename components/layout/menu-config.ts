import type { PermissionCode } from "@/lib/auth/permissions";

export type MenuItem = {
  title: string;
  href: string;

  // 图标使用字符串键，避免把组件函数放到配置里跨服务端/客户端传递
  icon: string;

  // 菜单是否展示由当前用户是否拥有该权限推导
  permission: PermissionCode;
};

export type MenuGroup = {
  title: string;
  items: MenuItem[];
};

/**
 * 只收录当前已经实现页面的菜单。
 * 新增业务模块时再往对应分组里添加，避免菜单链接指向 404。
 */
export const adminMenus: MenuGroup[] = [
  {
    title: "系统设置",
    items: [
      {
        title: "用户管理",
        href: "/admin/users",
        icon: "users",
        permission: "user.view",
      },
      {
        title: "角色管理",
        href: "/admin/roles",
        icon: "shield-check",
        permission: "role.view",
      },
    ],
  },
];

export function getPageBreadcrumb(pathname: string): string[] {
  const segments = pathname.split("/").filter(Boolean);

  if (segments[0] !== "admin") {
    return [];
  }

  const [, section, second, third, fourth] = segments;

  if (!section) {
    return ["后台工作台"];
  }

  if (section === "users") {
    const base = getBaseBreadcrumb("/admin/users");

    if (second === "new") {
      return [...base, "新增用户"];
    }

    if (third === "edit") {
      return [...base, "编辑用户"];
    }

    return base;
  }

  if (section === "roles") {
    const base = getBaseBreadcrumb("/admin/roles");

    if (second === "new") {
      return [...base, "新增角色"];
    }

    if (third === "edit") {
      return [...base, "编辑角色"];
    }

    if (third === "users") {
      return fourth === "add" ? [...base, "添加用户"] : [...base, "用户成员"];
    }

    if (third === "permissions") {
      return [...base, "分配权限"];
    }

    return base;
  }

  return [];
}

/**
 * 动态段（用户 ID、角色 ID）不查库，只展示到功能层级，
 * 具体对象名称由页面标题展示。
 */
function getBaseBreadcrumb(href: string): string[] {
  const group = adminMenus.find((menuGroup) =>
    menuGroup.items.some((item) => item.href === href)
  );

  const item = group?.items.find((menuItem) => menuItem.href === href);

  return group && item ? [group.title, item.title] : [];
}
