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

export function getMenuBreadcrumb(href: string): string[] {
  for (const group of adminMenus) {
    const item = group.items.find((menuItem) => menuItem.href === href);

    if (item) {
      return [group.title, item.title];
    }
  }

  return [];
}
