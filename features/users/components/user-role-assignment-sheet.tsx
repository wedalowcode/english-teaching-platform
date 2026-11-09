"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { updateUserRolesAction } from "../actions";

type RoleOption = {
  id: string;
  code: string;
  name: string;
  description: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  username: string;
  roles: RoleOption[];
  assignedRoleIds: string[];
};

export function UserRoleAssignmentSheet({
  open,
  onOpenChange,
  userId,
  username,
  roles,
  assignedRoleIds,
}: Props) {
  const [selected, setSelected] = useState(assignedRoleIds);
  const [pending, startTransition] = useTransition();

  function toggle(id: string, checked: boolean) {
    setSelected((current) =>
      checked ? [...current, id] : current.filter((item) => item !== id)
    );
  }

  function save() {
    const formData = new FormData();
    selected.forEach((id) => formData.append("roleIds", id));

    startTransition(async () => {
      try {
        const result = await updateUserRolesAction(userId, formData);

        if (result.success) {
          toast.success("角色分配成功");
          onOpenChange(false);
        } else {
          toast.error(result.message ?? "分配失败");
        }
      } catch {
        toast.error("操作失败，请稍后重试");
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>分配角色</SheetTitle>
          <SheetDescription>为用户「{username}」选择角色。</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4">
          {roles.map((role) => (
            <label key={role.id} className="flex items-start gap-3">
              <Checkbox
                checked={selected.includes(role.id)}
                onCheckedChange={(checked) => toggle(role.id, checked)}
              />
              <span>
                <span className="block font-medium">
                  {role.name}（{role.code}）
                </span>
                <span className="text-xs text-muted-foreground">
                  {role.description || "暂无说明"}
                </span>
              </span>
            </label>
          ))}

          {roles.length === 0 && (
            <p className="text-sm text-muted-foreground">
              暂无可分配角色，请先创建角色。
            </p>
          )}
        </div>

        <div className="border-t p-4">
          <p className="mb-3 text-sm text-muted-foreground">
            已选择 {selected.length} 个角色
          </p>
          <Button onClick={save} disabled={pending} className="w-full">
            {pending ? "保存中..." : "保存分配"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
