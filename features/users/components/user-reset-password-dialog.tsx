"use client";

import { useActionState, useCallback, useEffect, useState } from "react";

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
  userId: string;
  username: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
};

type ResetPasswordFormProps = {
  userId: string;
  onDone: () => void;
};

const initialState: ResetPasswordState = {};

function ResetPasswordForm({ userId, onDone }: ResetPasswordFormProps) {
  const actionWithId = resetUserPasswordAction.bind(null, userId);

  const [state, action, pending] = useActionState(actionWithId, initialState);

  const passwordError = state.fieldErrors?.password?.[0];

  const confirmPasswordError = state.fieldErrors?.confirmPassword?.[0];

  useEffect(() => {
    if (state.success) {
      onDone();
    }
  }, [state.success, onDone]);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`password-${userId}`}>新密码</Label>

        <Input
          id={`password-${userId}`}
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="请输入新密码，至少 8 位"
          aria-invalid={!!passwordError}
          aria-describedby={
            passwordError ? `password-error-${userId}` : undefined
          }
          required
        />

        {passwordError && (
          <p
            id={`password-error-${userId}`}
            className="text-sm text-destructive"
          >
            {passwordError}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`confirmPassword-${userId}`}>确认新密码</Label>

        <Input
          id={`confirmPassword-${userId}`}
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="请再次输入新密码"
          aria-invalid={!!confirmPasswordError}
          aria-describedby={
            confirmPasswordError
              ? `confirm-password-error-${userId}`
              : undefined
          }
          required
        />

        {confirmPasswordError && (
          <p
            id={`confirm-password-error-${userId}`}
            className="text-sm text-destructive"
          >
            {confirmPasswordError}
          </p>
        )}
      </div>

      {state.message && !state.success && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          取消
        </DialogClose>

        <Button type="submit" disabled={pending}>
          {pending ? "正在重置..." : "确认重置"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function UserResetPasswordDialog({
  userId,
  username,
  open,
  onOpenChange,
  hideTrigger = false,
}: UserResetPasswordDialogProps) {
  const [innerOpen, setInnerOpen] = useState(false);

  const controlled = open !== undefined;

  const dialogOpen = controlled ? open : innerOpen;

  const setDialogOpen = useCallback(
    (next: boolean) => {
      if (controlled) {
        onOpenChange?.(next);
      } else {
        setInnerOpen(next);
      }
    },
    [controlled, onOpenChange]
  );

  const close = useCallback(
    () => setDialogOpen(false),
    [setDialogOpen]
  );

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {!hideTrigger && (
        <DialogTrigger render={<Button variant="outline" size="sm" />}>
          重置密码
        </DialogTrigger>
      )}

      <DialogContent>
        <DialogHeader>
          <DialogTitle>重置用户密码</DialogTitle>

          <DialogDescription>
            正在为用户 {username} 重置密码。
            无需输入原密码，请设置新的登录密码。
          </DialogDescription>
        </DialogHeader>

        <ResetPasswordForm userId={userId} onDone={close} />
      </DialogContent>
    </Dialog>
  );
}
