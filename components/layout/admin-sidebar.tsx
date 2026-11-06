"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { adminMenus } from "./menu-config";

export function AdminSidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-[#101B3C] text-white">
      {/* 品牌区域 */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold shadow-lg shadow-blue-950/30">
          EE
        </div>

        <div>
          <div className="text-sm font-semibold tracking-wide">
            英语教学平台
          </div>
          <div className="text-[10px] tracking-wider text-blue-200/60">
            TEACHING MANAGEMENT
          </div>
        </div>
      </div>

      {/* 菜单区域 */}
      <nav className="admin-sidebar-scroll flex-1 space-y-5 overflow-y-auto px-3 py-5">
        {adminMenus.map((group) => (
          <div key={group.title}>
            <div className="mb-2 px-3 text-[11px] font-semibold tracking-widest text-slate-400">
              {group.title}
            </div>

            <div className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "group flex h-10 items-center gap-3 rounded-lg px-3 text-[13px] transition-all",
                      active
                        ? "bg-blue-600 font-semibold text-white shadow-md shadow-blue-950/30"
                        : "text-slate-300 hover:bg-white/10 hover:text-white",
                    ].join(" ")}
                  >
                    <Icon
                      className={[
                        "size-[17px] shrink-0",
                        active
                          ? "text-white"
                          : "text-slate-400 group-hover:text-blue-200",
                      ].join(" ")}
                    />

                    <span>{item.title}</span>

                    {active && (
                      <span className="ml-auto size-1.5 rounded-full bg-white" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
