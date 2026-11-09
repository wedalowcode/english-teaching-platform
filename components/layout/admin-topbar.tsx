import { SignOutButton } from "@/components/layout/sign-out-button";
import { SidebarTrigger } from "@/components/ui/sidebar";

type AdminTopbarProps = {
  user: {
    name: string;
    username: string | null;
  };
};

export function AdminTopbar({ user }: AdminTopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-border bg-card px-6">
      <SidebarTrigger className="-ml-2" aria-label="展开或收起侧边栏" />

      <div className="flex items-center gap-3">
        <div className="text-sm font-semibold text-foreground">启航英语</div>

        <span className="rounded-md bg-accent px-2 py-1 text-xs font-medium text-accent-foreground">
          管理后台
        </span>
      </div>

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
