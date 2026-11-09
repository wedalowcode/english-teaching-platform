"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);

    const result = await authClient.signOut();

    if (result.error) {
      setLoading(false);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={handleSignOut}
      disabled={loading}
      aria-label="退出登录"
    >
      <LogOut />
    </Button>
  );
}
