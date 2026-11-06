"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { resetUserPasswordAction } from "../actions";
import type { ResetPasswordState } from "../schemas";

type UserResetPasswordDialogProps = {
  user: {
    id: string;
    username: string;
  };
  menuItem?: boolean;
};

const initialState: ResetPasswordState = {};

export function UserResetPasswordDialog({
  user,
  menuItem = false,
}: UserResetPasswordDialogProps) {
  const actionWithId = resetUserPasswordAction.bind(null, user.id);

  const [state, action, pending] = useActionState(
    actionWithId,
    initialState
  );

  const passwordError = state.fieldErrors?.password?.[0];

  const confirmPasswordError =
    state.fieldErrors?.confirmPassword?.[0];

  return (
    <Dialog>
      {menuItem ? (
        <DialogTrigger
          render={
            <button
              type="button"
              className="flex w-full items-center rounded-sm px-2 py-2 text-left text-sm outline-none hover:bg-accent"
            />
          }
        >
          重置密码
        </DialogTrigger>
      ) : (
        <DialogTrigger
          render={
            <Button variant="outline" size="sm" />
          }
        >
          重置密码
        </DialogTrigger>
      )}

      <DialogContent>
        <DialogHeader>
          <DialogTitle>重置用户密码</DialogTitle>

          <DialogDescription>
            正在为用户 {user.username} 重置密码。
            无需输入原密码，请设置新的登录密码。
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`password-${user.id}`}>新密码</Label>

            <Input
              id={`password-${user.id}`}
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="请输入新密码，至少 8 位"
              aria-invalid={!!passwordError}
              aria-describedby={
                passwordError ? `password-error-${user.id}` : undefined
              }
              required
            />

            {passwordError && (
              <p
                id={`password-error-${user.id}`}
                className="text-sm text-destructive"
              >
                {passwordError}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`confirmPassword-${user.id}`}>
              确认新密码
            </Label>

            <Input
              id={`confirmPassword-${user.id}`}
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="请再次输入新密码"
              aria-invalid={!!confirmPasswordError}
              aria-describedby={
                confirmPasswordError
                  ? `confirm-password-error-${user.id}`
                  : undefined
              }
              required
            />

            {confirmPasswordError && (
              <p
                id={`confirm-password-error-${user.id}`}
                className="text-sm text-destructive"
              >
                {confirmPasswordError}
              </p>
            )}
          </div>

          {state.message && (
            <p role="alert" className="text-sm text-destructive">
              {state.message}
            </p>
          )}

          <DialogFooter>
            <DialogClose
              render={<Button type="button" variant="outline" />}
            >
              取消
            </DialogClose>

            <Button type="submit" disabled={pending}>
              {pending ? "正在重置..." : "确认重置"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
