"use client";

import { Fragment } from "react";
import { usePathname } from "next/navigation";

import { SignOutButton } from "@/components/layout/sign-out-button";
import { getPageBreadcrumb } from "@/components/layout/menu-config";
import { SidebarTrigger } from "@/components/ui/sidebar";

type AdminTopbarProps = {
  user: {
    name: string;
    username: string | null;
  };
};

export function AdminTopbar({ user }: AdminTopbarProps) {
  const pathname = usePathname();
  const breadcrumb = getPageBreadcrumb(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-border bg-card px-6">
      <SidebarTrigger className="-ml-2" aria-label="展开或收起侧边栏" />

      <nav aria-label="面包屑" className="flex min-w-0 items-center gap-1.5">
        {breadcrumb.map((item, index) => {
          const isCurrent = index === breadcrumb.length - 1;

          return (
            <Fragment key={`${item}-${index}`}>
              {index > 0 && (
                <span className="text-muted-foreground/60">/</span>
              )}

              <span
                className={
                  isCurrent
                    ? "truncate text-sm font-medium text-foreground"
                    : "truncate text-sm text-muted-foreground"
                }
              >
                {item}
              </span>
            </Fragment>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
          {user.name.slice(0, 1)}
        </div>

        <div className="hidden text-left sm:block">
          <div className="text-xs font-semibold text-foreground">
            {user.name}
          </div>

          <div className="text-xs text-muted-foreground">{user.username}</div>
        </div>

        <SignOutButton />
      </div>
    </header>
  );
}
