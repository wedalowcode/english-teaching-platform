import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Library,
  Settings,
  ShieldCheck,
  ShoppingCart,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";

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

export const adminMenus: MenuGroup[] = [
  {
    title: "工作台",
    items: [
      {
        title: "经营概览",
        href: "/admin/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "招生管理",
    items: [
      {
        title: "客户线索",
        href: "/admin/leads",
        icon: ClipboardList,
      },
      {
        title: "代理管理",
        href: "/admin/agents",
        icon: Users,
      },
    ],
  },
  {
    title: "教学管理",
    items: [
      {
        title: "学员管理",
        href: "/admin/students",
        icon: GraduationCap,
      },
      {
        title: "家长管理",
        href: "/admin/parents",
        icon: UserRound,
      },
      {
        title: "教师管理",
        href: "/admin/teachers",
        icon: Users,
      },
    ],
  },
  {
    title: "排课管理",
    items: [
      {
        title: "排课总览",
        href: "/admin/schedules",
        icon: CalendarDays,
      },
      {
        title: "课程记录",
        href: "/admin/courses",
        icon: BookOpen,
      },
    ],
  },
  {
    title: "商品与财务",
    items: [
      {
        title: "课程订单",
        href: "/admin/orders",
        icon: ShoppingCart,
      },
      {
        title: "财务管理",
        href: "/admin/finance",
        icon: Wallet,
      },
    ],
  },
  {
    title: "资源中心",
    items: [
      {
        title: "词库管理",
        href: "/admin/wordbooks",
        icon: Library,
      },
    ],
  },
  {
    title: "系统设置",
    items: [
      {
        title: "用户管理",
        href: "/admin/users",
        icon: Users,
      },
      {
        title: "角色权限",
        href: "/admin/roles",
        icon: ShieldCheck,
      },
      {
        title: "系统设置",
        href: "/admin/system",
        icon: Settings,
      },
    ],
  },
];
