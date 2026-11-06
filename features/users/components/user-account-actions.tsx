"use client";

import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { UserResetPasswordDialog } from "./user-reset-password-dialog";

import {
  setUserStatusAction,
  deleteUserAction,
} from "../actions";

type UserAccountActionsProps = {
  user: {
    id: string;
    username: string;
    status: "ACTIVE" | "DISABLED";
  };
};

export function UserAccountActions({
  user,
}: UserAccountActionsProps) {
  const nextStatus =
    user.status === "ACTIVE" ? "DISABLED" : "ACTIVE";

  const statusAction = setUserStatusAction.bind(
    null,
    user.id,
    nextStatus
  );

  const deleteAction = deleteUserAction.bind(
    null,
    user.id
  );

  const isActive = user.status === "ACTIVE";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm">
            <MoreHorizontal className="size-4" />
            更多
          </Button>
        }
      />

      <DropdownMenuContent align="end">
        <UserResetPasswordDialog
          user={user}
          menuItem
        />

        <DropdownMenuSeparator />

        <form action={statusAction}>
          <DropdownMenuItem
            render={<button type="submit" className="w-full text-left" />}
          >
            {isActive ? "停用账号" : "启用账号"}
          </DropdownMenuItem>
        </form>

        <DropdownMenuSeparator />

        <AlertDialog>
          <AlertDialogTrigger
            render={
              <DropdownMenuItem className="text-destructive" />
            }
          >
            删除用户
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                确认删除用户？
              </AlertDialogTitle>

              <AlertDialogDescription>
                即将永久删除用户「{user.username}」。
                删除后无法恢复，请确认该用户没有需要保留的业务数据。
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel>
                取消
              </AlertDialogCancel>

              <form action={deleteAction}>
                <AlertDialogAction
                  type="submit"
                  variant="destructive"
                >
                  确认删除
                </AlertDialogAction>
              </form>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
