"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

type Props = {
  showLabel?: boolean;
};

export function SignOutButton({ showLabel = false }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);

    try {
      const result = await authClient.signOut();

      if (result.error) {
        toast.error("退出登录失败，请重试");
        return;
      }

      // 整页跳转而不是 router.replace：
      // 彻底丢弃客户端路由缓存，避免按返回键看到受保护页面的旧内容。
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/login");
    } catch {
      toast.error("退出登录失败，请检查网络后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size={showLabel ? "default" : "icon-sm"}
      onClick={handleSignOut}
      disabled={loading}
      aria-label="退出登录"
    >
      <LogOut />
      {showLabel && <span>退出登录</span>}
    </Button>
  );
}
