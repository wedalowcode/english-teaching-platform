"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

import { saveRolePermissionsAction } from "../actions";

type Permission = {
  code: string;
  name: string;
  module: string;
  scopeable: boolean;
};

type Scope = "ALL" | "OWN" | "ASSIGNED";

type RolePermissionFormProps = {
  roleId: string;
  permissions: Permission[];
  assigned: {
    permissionCode: string;
    scope: Scope;
  }[];
};

const SCOPE_LABELS: Record<Scope, string> = {
  ALL: "全部",
  OWN: "本人",
  ASSIGNED: "已分配",
};

export function RolePermissionForm({
  roleId,
  permissions,
  assigned,
}: RolePermissionFormProps) {
  const [pending, startTransition] = useTransition();

  const [selected, setSelected] = useState<Record<string, Scope>>(
    Object.fromEntries(
      assigned.map((item) => [item.permissionCode, item.scope])
    )
  );

  function toggle(code: string, checked: boolean) {
    setSelected((current) => {
      const next = { ...current };

      if (checked) {
        next[code] = "ALL";
      } else {
        delete next[code];
      }

      return next;
    });
  }

  function changeScope(code: string, scope: Scope) {
    setSelected((current) => ({
      ...current,
      [code]: scope,
    }));
  }

  function save() {
    const values = Object.entries(selected).map(([code, scope]) => ({
      code,
      scope,
    }));

    startTransition(async () => {
      try {
        const result = await saveRolePermissionsAction(roleId, values);

        if (result.success) {
          toast.success("角色权限保存成功");
        } else {
          toast.error(result.message ?? "保存失败");
        }
      } catch {
        toast.error("保存失败，请稍后重试");
      }
    });
  }

  // 按权限目录中的模块分组展示，不把所有权限混在一起
  const groups = Object.groupBy(permissions, (item) => item.module);

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([module, items]) => (
        <section
          key={module}
          className="space-y-4 rounded-lg border bg-card p-4"
        >
          <h3 className="font-semibold">{module}</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            {items?.map((item) => {
              const checked = item.code in selected;

              return (
                <div
                  key={item.code}
                  className="flex flex-wrap items-center gap-3"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(value) =>
                      toggle(item.code, value === true)
                    }
                  />

                  <span className="text-sm">{item.name}</span>

                  {checked && item.scopeable && (
                    <div className="flex gap-1">
                      {(["ALL", "OWN", "ASSIGNED"] as Scope[]).map(
                        (scope) => (
                          <Button
                            key={scope}
                            size="sm"
                            variant={
                              selected[item.code] === scope
                                ? "default"
                                : "outline"
                            }
                            onClick={() => changeScope(item.code, scope)}
                          >
                            {SCOPE_LABELS[scope]}
                          </Button>
                        )
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <div className="flex justify-end">
        <Button onClick={save} disabled={pending}>
          {pending ? "正在保存..." : "保存权限"}
        </Button>
      </div>
    </div>
  );
}
