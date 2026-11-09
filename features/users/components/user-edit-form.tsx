"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { updateUserAction } from "../actions";
import type { UpdateUserState } from "../schemas";

type UserEditFormProps = {
  user: {
    id: string;
    name: string;
    email: string;
    username: string | null;
    phone: string | null;
  };
};

const initialState: UpdateUserState = {};

export function UserEditForm({ user }: UserEditFormProps) {
  const actionWithId = updateUserAction.bind(null, user.id);

  const [state, action, pending] = useActionState(
    actionWithId,
    initialState
  );

  const nameError = state.fieldErrors?.name?.[0];
  const emailError = state.fieldErrors?.email?.[0];
  const usernameError = state.fieldErrors?.username?.[0];
  const phoneError = state.fieldErrors?.phone?.[0];

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">姓名</Label>

        <Input
          id="name"
          name="name"
          autoComplete="off"
          defaultValue={state.values?.name ?? user.name}
          aria-invalid={!!nameError}
          aria-describedby={nameError ? "name-error" : undefined}
          required
        />

        {nameError && (
          <p id="name-error" className="text-sm text-destructive">
            {nameError}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">邮箱</Label>

        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="off"
          defaultValue={state.values?.email ?? user.email}
          aria-invalid={!!emailError}
          aria-describedby={emailError ? "email-error" : undefined}
          required
        />

        {emailError && (
          <p id="email-error" className="text-sm text-destructive">
            {emailError}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">用户名</Label>

        <Input
          id="username"
          name="username"
          autoComplete="off"
          defaultValue={state.values?.username ?? user.username ?? ""}
          aria-invalid={!!usernameError}
          aria-describedby={usernameError ? "username-error" : undefined}
          required
        />

        {usernameError && (
          <p id="username-error" className="text-sm text-destructive">
            {usernameError}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">手机号</Label>

        <Input
          id="phone"
          name="phone"
          autoComplete="off"
          defaultValue={state.values?.phone ?? user.phone ?? ""}
          aria-invalid={!!phoneError}
          aria-describedby={phoneError ? "phone-error" : undefined}
        />

        {phoneError && (
          <p id="phone-error" className="text-sm text-destructive">
            {phoneError}
          </p>
        )}
      </div>

      {state.message && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "正在保存..." : "保存修改"}
      </Button>
    </form>
  );
}
