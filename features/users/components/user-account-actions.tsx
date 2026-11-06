"use client";

import { Button } from "@/components/ui/button";

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

import { setUserStatusAction, deleteUserAction } from "../actions";

type UserAccountActionsProps = {
  user: {
    id: string;
    username: string;
    status: "ACTIVE" | "DISABLED";
  };
};

export function UserAccountActions({ user }: UserAccountActionsProps) {
  const nextStatus = user.status === "ACTIVE" ? "DISABLED" : "ACTIVE";

  const statusAction = setUserStatusAction.bind(null, user.id, nextStatus);

  const deleteAction = deleteUserAction.bind(null, user.id);

  const isActive = user.status === "ACTIVE";

  return (
    <div className="flex justify-end gap-2">
      <form action={statusAction}>
        <Button type="submit" size="sm" variant="outline">
          {isActive ? "停用" : "启用"}
        </Button>
      </form>

      <AlertDialog>
        <AlertDialogTrigger render={<Button size="sm" variant="destructive" />}>
          删除
        </AlertDialogTrigger>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除用户？</AlertDialogTitle>

            <AlertDialogDescription>
              即将永久删除用户「{user.username}」。
              删除后无法恢复，请确认该用户没有需要保留的业务数据。
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>

            <form action={deleteAction}>
              <AlertDialogAction type="submit" variant="destructive">
                确认删除
              </AlertDialogAction>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
