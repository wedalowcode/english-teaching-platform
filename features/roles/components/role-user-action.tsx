"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { addUserToRoleAction, removeUserFromRoleAction } from "../actions";

type RoleUserActionProps = {
  roleId: string;
  userId: string;
  mode: "add" | "remove";
};

export function RoleUserAction({
  roleId,
  userId,
  mode,
}: RoleUserActionProps) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        const result =
          mode === "add"
            ? await addUserToRoleAction(roleId, userId)
            : await removeUserFromRoleAction(roleId, userId);

        if (result.success) {
          toast.success(mode === "add" ? "用户添加成功" : "用户已移除");
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
      variant={mode === "remove" ? "outline" : "default"}
      disabled={pending}
      onClick={handleClick}
    >
      {pending ? "处理中..." : mode === "add" ? "添加" : "移除"}
    </Button>
  );
}
