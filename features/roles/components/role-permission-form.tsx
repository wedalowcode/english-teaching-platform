"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Search,
  ShieldCheck,
  Check,
  Database,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

import { saveRolePermissionsAction } from "../actions";

type Scope = "ALL" | "OWN" | "ASSIGNED";

type Permission = {
  code: string;
  name: string;
  module: string;
  resource: string;
  action: string;
  scopeable: boolean;
};

type RolePermissionFormProps = {
  roleId: string;
  permissions: Permission[];
  isSuperAdmin: boolean;
  assigned: {
    permissionCode: string;
    scope: Scope;
  }[];
};

const SCOPE_OPTIONS: {
  value: Scope;
  label: string;
  description: string;
}[] = [
  {
    value: "ALL",
    label: "全部数据",
    description: "可以访问该资源范围内的全部数据",
  },
  {
    value: "OWN",
    label: "本人数据",
    description: "只能访问本人负责或创建的数据",
  },
  {
    value: "ASSIGNED",
    label: "已分配数据",
    description: "只能访问明确分配给当前用户的数据",
  },
];

export function RolePermissionForm({
  roleId,
  permissions,
  isSuperAdmin,
  assigned,
}: RolePermissionFormProps) {
  const [pending, startTransition] = useTransition();

  const [keyword, setKeyword] = useState("");
  const [activeModule, setActiveModule] = useState("全部模块");

  const [selected, setSelected] = useState<Record<string, Scope>>(
    Object.fromEntries(
      assigned.map((item) => [
        item.permissionCode,
        item.scope,
      ])
    )
  );

  // 提取模块列表
  const modules = useMemo(() => {
    return [
      "全部模块",
      ...Array.from(
        new Set(permissions.map((item) => item.module))
      ),
    ];
  }, [permissions]);

  // 搜索和模块过滤
  const filteredPermissions = useMemo(() => {
    const search = keyword.trim().toLowerCase();

    return permissions.filter((item) => {
      const matchesModule =
        activeModule === "全部模块" ||
        item.module === activeModule;

      const matchesKeyword =
        !search ||
        item.name.toLowerCase().includes(search) ||
        item.code.toLowerCase().includes(search) ||
        item.module.toLowerCase().includes(search) ||
        item.resource.toLowerCase().includes(search);

      return matchesModule && matchesKeyword;
    });
  }, [permissions, keyword, activeModule]);

  // 按模块分组
  const groupedPermissions = useMemo(() => {
    const groups = new Map<string, Permission[]>();

    for (const permission of filteredPermissions) {
      const current = groups.get(permission.module) ?? [];
      current.push(permission);
      groups.set(permission.module, current);
    }

    return Array.from(groups.entries());
  }, [filteredPermissions]);

  const selectedCount = Object.keys(selected).length;

  // 切换权限
  function togglePermission(code: string, checked: boolean) {
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

  // 修改数据范围
  function changeScope(code: string, scope: Scope) {
    setSelected((current) => ({
      ...current,
      [code]: scope,
    }));
  }

  // 保存权限
  function save() {
    const values = Object.entries(selected).map(
      ([code, scope]) => ({
        code,
        scope,
      })
    );

    startTransition(async () => {
      try {
        const result = await saveRolePermissionsAction(
          roleId,
          values
        );

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

  return (
    <div className="space-y-5">
      {/* 超级管理员说明 */}
      {isSuperAdmin && (
        <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
          <ShieldCheck className="mt-0.5 size-5 text-primary" />

          <div className="space-y-1">
            <div className="font-medium">
              超级管理员内置系统权限
            </div>

            <p className="text-sm text-muted-foreground">
              用户管理、角色管理等系统权限由超级管理员身份自动获得，
              不需要在此逐项分配。
            </p>
          </div>
        </div>
      )}

      {/* 权限统计 */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4">
        <div>
          <div className="text-sm text-muted-foreground">
            当前已授权权限
          </div>

          <div className="mt-1 text-2xl font-semibold">
            {selectedCount}
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              项
            </span>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          共 {permissions.length} 项可分配权限
        </div>
      </div>

      {/* 搜索区域 */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={keyword}
            onChange={(event) =>
              setKeyword(event.target.value)
            }
            placeholder="搜索权限名称、权限编码或资源..."
            className="pl-9"
          />
        </div>

        {/* 模块筛选 */}
        <div className="flex flex-wrap gap-2">
          {modules.map((module) => (
            <Button
              key={module}
              size="sm"
              variant={
                activeModule === module
                  ? "default"
                  : "outline"
              }
              onClick={() => setActiveModule(module)}
            >
              {module}
            </Button>
          ))}
        </div>
      </div>

      {/* 权限列表 */}
      <div className="space-y-5">
        {groupedPermissions.map(([module, items]) => {
          const moduleSelectedCount = items.filter(
            (item) => item.code in selected
          ).length;

          return (
            <section
              key={module}
              className="overflow-hidden rounded-lg border bg-card"
            >
              {/* 模块标题 */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/30 px-4 py-3">
                <div className="font-semibold">
                  {module}
                </div>

                <div className="text-xs text-muted-foreground">
                  已授权 {moduleSelectedCount} / {items.length}
                </div>
              </div>

              {/* 模块权限 */}
              <div className="divide-y">
                {items.map((item) => {
                  const checked = item.code in selected;

                  return (
                    <div
                      key={item.code}
                      className="space-y-3 p-4"
                    >
                      {/* 权限主体 */}
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) =>
                            togglePermission(
                              item.code,
                              value === true
                            )
                          }
                          className="mt-0.5"
                        />

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium">
                              {item.name}
                            </span>

                            {checked && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                                <Check className="size-3" />
                                已授权
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-muted-foreground">
                            {item.code}
                          </div>
                        </div>
                      </div>

                      {/* 数据范围配置 */}
                      {checked && item.scopeable && (
                        <div className="ml-7 space-y-3 rounded-md bg-muted/30 p-3">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Database className="size-4 text-muted-foreground" />
                            数据范围
                          </div>

                          <div className="grid gap-2 sm:grid-cols-3">
                            {SCOPE_OPTIONS.map((option) => {
                              const active =
                                selected[item.code] ===
                                option.value;

                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() =>
                                    changeScope(
                                      item.code,
                                      option.value
                                    )
                                  }
                                  className={[
                                    "rounded-md border p-3 text-left transition-colors",
                                    active
                                      ? "border-primary bg-primary/5"
                                      : "border-border bg-background hover:bg-muted",
                                  ].join(" ")}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-medium">
                                      {option.label}
                                    </span>

                                    {active && (
                                      <Check className="size-4 text-primary" />
                                    )}
                                  </div>

                                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                    {option.description}
                                  </p>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {checked && !item.scopeable && (
                        <div className="ml-7 text-xs text-muted-foreground">
                          此权限不支持单独配置数据范围。
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* 无搜索结果 */}
        {filteredPermissions.length === 0 && (
          <div className="rounded-lg border border-dashed p-10 text-center">
            <Search className="mx-auto size-8 text-muted-foreground" />

            <p className="mt-3 text-sm font-medium">
              没有找到匹配的权限
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              请调整搜索条件或切换业务模块
            </p>
          </div>
        )}
      </div>

      {/* 底部操作 */}
      <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t bg-background/95 py-4 backdrop-blur">
        <div className="text-sm text-muted-foreground">
          已选择 {selectedCount} 项权限
        </div>

        <Button
          onClick={save}
          disabled={pending}
        >
          {pending ? "正在保存..." : "保存权限配置"}
        </Button>
      </div>
    </div>
  );
}
