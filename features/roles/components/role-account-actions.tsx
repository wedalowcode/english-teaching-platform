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
  canEdit: boolean;
  canDisable: boolean;
  canAssignUser: boolean;
  canAssignPermissions: boolean;
};

export function RoleAccountActions({
  roleId,
  isActive,
  isSystem,
  canEdit,
  canDisable,
  canAssignUser,
  canAssignPermissions,
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

  // 一个操作都没有权限时，整个「更多」入口也不展示
  if (!canEdit && !canDisable && !canAssignUser && !canAssignPermissions) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
        <MoreHorizontal className="mr-1 size-4" />
        更多
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        {canEdit && (
          <>
            <DropdownMenuItem
              render={<Link href={`/admin/roles/${roleId}/edit`} />}
            >
              编辑角色
            </DropdownMenuItem>

            {(canDisable || canAssignUser || canAssignPermissions) && (
              <DropdownMenuSeparator />
            )}
          </>
        )}

        {canDisable && (
          <>
            <DropdownMenuItem
              disabled={pending || (isSystem && isActive)}
              onClick={handleStatusChange}
            >
              {pending ? "处理中..." : isActive ? "停用角色" : "启用角色"}
            </DropdownMenuItem>

            {(canAssignUser || canAssignPermissions) && (
              <DropdownMenuSeparator />
            )}
          </>
        )}

        {canAssignUser && (
          <DropdownMenuItem
            render={<Link href={`/admin/roles/${roleId}/users`} />}
          >
            分配用户
          </DropdownMenuItem>
        )}

        {canAssignPermissions && (
          <DropdownMenuItem
            render={<Link href={`/admin/roles/${roleId}/permissions`} />}
          >
            分配权限
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
