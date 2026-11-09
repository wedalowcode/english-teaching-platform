import { Users } from "lucide-react";

import type { LucideIcon } from "lucide-react";

export type MenuItem = {
  title: string;
  href: string;
  icon: LucideIcon;
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
        icon: Users,
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
