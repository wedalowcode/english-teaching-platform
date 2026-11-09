"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { setRoleStatusAction } from "../actions";

type Props = {
  roleId: string;
  isActive: boolean;
  isSystem: boolean;
};

export function RoleStatusAction({ roleId, isActive, isSystem }: Props) {
  const [pending, startTransition] = useTransition();

  const nextStatus = !isActive;

  function handleClick() {
    startTransition(async () => {
      try {
        const result = await setRoleStatusAction(roleId, nextStatus);

        if (result.success) {
          toast.success(nextStatus ? "角色已启用" : "角色已停用");
        } else {
          toast.error(result.message ?? "操作失败");
        }
      } catch {
        toast.error("操作失败，请稍后重试");
      }
    });
  }

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending || (isSystem && isActive)}
      onClick={handleClick}
    >
      {pending ? "处理中..." : isActive ? "停用" : "启用"}
    </Button>
  );
}
