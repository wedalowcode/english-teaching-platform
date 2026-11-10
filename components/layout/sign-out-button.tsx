"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

type Props = {
  showLabel?: boolean;
};

export function SignOutButton({ showLabel = false }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);

    try {
      const result = await authClient.signOut();

      if (result.error) {
        toast.error("退出登录失败，请重试");
        return;
      }

      router.replace("/login");
      router.refresh();
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
