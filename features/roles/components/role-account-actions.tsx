"use client";

import { useTransition } from "react";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { setRoleStatusAction } from "../actions";

type RoleAccountActionsProps = {
  roleId: string;
  isActive: boolean;
  isSystem: boolean;
};

export function RoleAccountActions({
  roleId,
  isActive,
  isSystem,
}: RoleAccountActionsProps) {
  const [pending, startTransition] = useTransition();

  function handleStatusChange() {
    const nextStatus = !isActive;

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
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
        <MoreHorizontal className="mr-1 size-4" />
        更多
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem
          render={<Link href={`/admin/roles/${roleId}/edit`} />}
        >
          编辑角色
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          disabled={pending || (isSystem && isActive)}
          onClick={handleStatusChange}
        >
          {pending ? "处理中..." : isActive ? "停用角色" : "启用角色"}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          render={<Link href={`/admin/roles/${roleId}/users`} />}
        >
          分配用户
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
