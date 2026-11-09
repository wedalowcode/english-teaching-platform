"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createRoleAction, updateRoleAction } from "../actions";
import type { RoleFormState } from "../schemas";

type RoleFormProps = {
  role?: {
    id: string;
    code: string;
    name: string;
    description: string | null;
  };
};

const initialState: RoleFormState = {};

export function RoleForm({ role }: RoleFormProps) {
  const action = role ? updateRoleAction.bind(null, role.id) : createRoleAction;

  const [state, formAction, pending] = useActionState(action, initialState);

  const codeError = state.fieldErrors?.code?.[0];
  const nameError = state.fieldErrors?.name?.[0];
  const descriptionError = state.fieldErrors?.description?.[0];

  return (
    <form action={formAction} className="space-y-4">
      {!role && (
        <div className="space-y-2">
          <Label htmlFor="code">角色编码</Label>

          <Input
            id="code"
            name="code"
            autoComplete="off"
            defaultValue={state.values?.code}
            placeholder="例如 COURSE_MANAGER"
            aria-invalid={!!codeError}
            aria-describedby={codeError ? "code-error" : undefined}
            required
          />

          {codeError && (
            <p id="code-error" className="text-sm text-destructive">
              {codeError}
            </p>
          )}

          <p className="text-xs text-muted-foreground">
            创建后不可修改，建议使用大写英文和下划线。
          </p>
        </div>
      )}

      {role && (
        <div className="space-y-2">
          <Label htmlFor="code-readonly">角色编码</Label>
          <Input id="code-readonly" value={role.code} disabled />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">角色名称</Label>

        <Input
          id="name"
          name="name"
          autoComplete="off"
          defaultValue={state.values?.name ?? role?.name}
          placeholder="请输入角色名称"
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
        <Label htmlFor="description">角色说明</Label>

        <Input
          id="description"
          name="description"
          autoComplete="off"
          defaultValue={state.values?.description ?? role?.description ?? ""}
          placeholder="描述该角色负责的业务范围"
          aria-invalid={!!descriptionError}
          aria-describedby={descriptionError ? "description-error" : undefined}
        />

        {descriptionError && (
          <p id="description-error" className="text-sm text-destructive">
            {descriptionError}
          </p>
        )}
      </div>

      {state.message && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "正在保存..." : role ? "保存修改" : "创建角色"}
      </Button>
    </form>
  );
}
