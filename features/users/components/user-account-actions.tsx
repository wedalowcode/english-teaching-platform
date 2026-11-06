"use client";

import { useState, useTransition } from "react";

import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import type { UserStatus } from "@/app/generated/prisma/client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { deleteUserAction, setUserStatusAction } from "../actions";
import { UserResetPasswordDialog } from "./user-reset-password-dialog";

type UserAccountActionsProps = {
  userId: string;
  username: string;
  status: UserStatus;
};

export function UserAccountActions({
  userId,
  username,
  status,
}: UserAccountActionsProps) {
  const isActive = status === "ACTIVE";
  const nextStatus: UserStatus = isActive ? "DISABLED" : "ACTIVE";

  const [resetOpen, setResetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [deletePending, startDeleteTransition] = useTransition();

  async function handleStatusChange() {
    try {
      const result = await setUserStatusAction(userId, nextStatus);

      if (result.success) {
        toast.success(isActive ? "账号已停用" : "账号已启用");
      } else {
        toast.error(result.message ?? "操作失败");
      }
    } catch {
      toast.error("操作失败，请稍后重试");
    }
  }

  function handleDelete() {
    startDeleteTransition(async () => {
      try {
        const result = await deleteUserAction(userId);

        if (result.success) {
          setDeleteOpen(false);
          toast.success("用户已删除");
        } else {
          toast.error(result.message ?? "删除失败");
        }
      } catch {
        toast.error("删除失败，请稍后重试");
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
          <MoreHorizontal className="mr-1 size-4" />
          更多
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setResetOpen(true)}>
            重置密码
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleStatusChange}>
            {isActive ? "停用账号" : "启用账号"}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
          >
            删除用户
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <UserResetPasswordDialog
        userId={userId}
        username={username}
        open={resetOpen}
        onOpenChange={setResetOpen}
        hideTrigger
      />

      <AlertDialog
        open={deleteOpen}
        onOpenChange={(next) => {
          if (!deletePending) {
            setDeleteOpen(next);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除用户？</AlertDialogTitle>

            <AlertDialogDescription>
              即将永久删除用户「{username}」，该用户名会同时被释放。
              删除后无法恢复，请确认该用户没有需要保留的业务数据。
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePending}>
              取消
            </AlertDialogCancel>

            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={deletePending}
            >
              {deletePending ? "正在删除..." : "确认删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
