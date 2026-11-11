"use client";

import { useMemo, useState, useTransition } from "react";
import { Database, Search } from "lucide-react";
import { toast } from "sonner";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";

import { saveRolePermissionsAction } from "../actions";

type Scope = "ALL" | "OWN" | "ASSIGNED";

type PermissionMeta = {
  code: string;
  name: string;
  module: string;
  resource: string;
  action: string;
  scopeable: boolean;
};

type Assigned = {
  permissionCode: string;
  scope: Scope;
};

type Props = {
  roleId: string;
  permissions: PermissionMeta[];
  assigned: Assigned[];
  isSuperAdmin: boolean;
};

const RESOURCE_LABELS: Record<string, string> = {
  portal: "系统入口",
  user: "用户管理",
  role: "角色管理",
  dashboard: "经营管理",
  lead: "线索",
  leadFollowUp: "跟进记录",
  enrollment: "报名",
  order: "订单",
  payment: "收款记录",
  student: "学生",
  course: "课程",
  schedule: "排课",
  teachingRecord: "教学记录",
  vocabularyRequest: "词汇申请",
  lessonLedger: "课时账本",
  teacherAssignment: "教师任务",
  teacherSettlement: "教师结算",
  parentReport: "家长报告",
};

const SCOPE_OPTIONS: { value: Scope; label: string }[] = [
  { value: "ALL", label: "全部" },
  { value: "OWN", label: "本人" },
  { value: "ASSIGNED", label: "已分配" },
];

function resourceLabel(resource: string) {
  return RESOURCE_LABELS[resource] ?? resource;
}

export function RolePermissionForm({
  roleId,
  permissions = [],
  assigned = [],
  isSuperAdmin,
}: Props) {
  const [selected, setSelected] = useState<Record<string, Scope>>(
    () =>
      Array.isArray(assigned)
        ? Object.fromEntries(assigned.map((item) => [item.permissionCode, item.scope]))
        : {},
  );
  const [pending, startTransition] = useTransition();
  const [activeModule, setActiveModule] = useState<string | null>(
    Array.isArray(permissions) ? permissions[0]?.module ?? null : null,
  );
  const [moduleQuery, setModuleQuery] = useState("");
  const [permissionQuery, setPermissionQuery] = useState("");
  const [openAccordions, setOpenAccordions] = useState<string[]>(() => {
    if (!Array.isArray(permissions)) return [];
    const initialModule = permissions[0]?.module;
    if (!initialModule) return [];
    const perms = permissions.filter((p) => p.module === initialModule);
    return [...new Set(perms.map((p) => p.resource))];
  });

  const modules = useMemo(() => {
    if (!Array.isArray(permissions)) return [];

    // 先按 module 聚合总数和已选数
    const grouped = new Map<string, { total: number; selected: number }>();

    for (const perm of permissions) {
      const current = grouped.get(perm.module) ?? { total: 0, selected: 0 };
      current.total += 1;
      if (selected[perm.code]) current.selected += 1;
      grouped.set(perm.module, current);
    }

    return [...grouped.entries()]
      .filter(([module]) => module.toLowerCase().includes(moduleQuery.toLowerCase()))
      .map(([module, counts]) => ({ module, ...counts }));
  }, [permissions, moduleQuery, selected]);

  const activePermissions = useMemo(() => {
    if (!Array.isArray(permissions)) return [];

    const items = permissions.filter((p) => p.module === activeModule);

    if (!permissionQuery.trim()) return items;

    const q = permissionQuery.toLowerCase();
    return items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        resourceLabel(p.resource).toLowerCase().includes(q),
    );
  }, [permissions, activeModule, permissionQuery]);

  // 按 resource 分组
  const resourceGroups = useMemo(() => {
    const map = new Map<string, PermissionMeta[]>();
    for (const perm of activePermissions) {
      map.set(perm.resource, [...(map.get(perm.resource) ?? []), perm]);
    }
    return [...map.entries()];
  }, [activePermissions]);

  const selectedCount = Object.keys(selected).length;
  const totalPermissionCount = permissions.length;

  // 打开所有有选中项的 resource 组
  function toggleAccordion(value: string) {
    setOpenAccordions((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value],
    );
  }

  // 切换模块时，默认展开全部 resource 组
  function switchModule(module: string) {
    setActiveModule(module);
    setPermissionQuery("");
    const perms = permissions.filter((p) => p.module === module);
    setOpenAccordions([...new Set(perms.map((p) => p.resource))]);
  }

  function togglePermission(code: string, checked: boolean) {
    setSelected((prev) => {
      const next = { ...prev };

      if (checked) {
        const perm = permissions.find((p) => p.code === code);
        next[code] = perm?.scopeable ? "ALL" : "ALL";
      } else {
        delete next[code];
      }

      return next;
    });
  }

  function changeScope(code: string, scope: Scope) {
    setSelected((prev) => ({ ...prev, [code]: scope }));
  }

  function selectAll() {
    setSelected((prev) => {
      const next = { ...prev };
      for (const perm of activePermissions) {
        next[perm.code] = "ALL";
      }
      return next;
    });
  }

  function clearAll() {
    setSelected((prev) => {
      const keep: Record<string, Scope> = {};
      for (const perm of permissions) {
        if (perm.module !== activeModule && prev[perm.code]) {
          keep[perm.code] = prev[perm.code];
        }
      }
      return keep;
    });
  }

  function save() {
    const values = Object.entries(selected).map(([code, scope]) => ({ code, scope }));

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

  if (isSuperAdmin) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">
          超级管理员的系统权限由身份自动获得，不需要也不能在这里配置。
        </p>
      </Card>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <p className="shrink-0 text-sm text-muted-foreground">
        共 {totalPermissionCount} 项可分配权限，当前已勾选 {selectedCount} 项 · 当前模块 {activeModule ?? "—"}（{activePermissions.length} 项）
      </p>

      {/* 左右分栏：模块导航 + 权限列表 */}
      <div className="grid min-h-0 flex-1 gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
        {/* 模块导航 */}
        <Card className="flex min-h-0 flex-col p-3">
          <div className="space-y-2">
            <Input
              value={moduleQuery}
              onChange={(e) => setModuleQuery(e.target.value)}
              placeholder="搜索模块..."
              className="h-8"
            />
          </div>

          <ScrollArea className="mt-3 flex-1">
            <div className="space-y-1 pr-2">
              {modules.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  暂无匹配模块
                </p>
              ) : (
                modules.map(({ module, total, selected: selectedInModule }) => (
                  <button
                    key={module}
                    type="button"
                    onClick={() => switchModule(module)}
                    className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${
                      activeModule === module
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    <span>{module}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-xs ${
                        activeModule === module
                          ? "bg-primary-foreground/20"
                          : selectedInModule > 0
                            ? "bg-primary/20 text-primary"
                            : "bg-muted-foreground/20"
                      }`}
                    >
                      {selectedInModule}/{total}
                    </span>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* 权限列表（按 resource 折叠） */}
        <Card className="flex min-h-0 flex-col p-0">
          {/* 模块工具栏 */}
          <div className="flex shrink-0 flex-wrap items-center gap-2 border-b p-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={selectAll}
            >
              全选
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearAll}
            >
              清空
            </Button>

            <div className="ml-auto flex items-center gap-2">
              <Search className="size-4 text-muted-foreground" />
              <Input
                value={permissionQuery}
                onChange={(e) => setPermissionQuery(e.target.value)}
                placeholder="搜索权限..."
                className="h-8 w-56"
              />
            </div>
          </div>

          {resourceGroups.length === 0 ? (
            <div className="flex flex-1 min-h-0 items-center justify-center p-10 text-center text-sm text-muted-foreground">
              当前模块没有可分配的权限
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-auto">
              <Accordion
                multiple
                value={openAccordions}
                onValueChange={setOpenAccordions}
                className="w-full"
              >
              {resourceGroups.map(([resource, items]) => {
                const selectedInGroup = items.filter(
                  (p) => selected[p.code],
                ).length;

                return (
                  <AccordionItem
                    key={resource}
                    value={resource}
                    className="px-4"
                  >
                    <AccordionTrigger
                      onClick={() => toggleAccordion(resource)}
                      className="py-2 text-sm"
                    >
                      <span className="flex-1 text-left">
                        {resourceLabel(resource)}
                      </span>
                      <span className="mr-2 text-xs text-muted-foreground">
                        ({selectedInGroup}/{items.length})
                      </span>
                    </AccordionTrigger>

                    <AccordionContent className="space-y-2 pb-3">
                      {items.map((perm) => {
                        const isChecked = !!selected[perm.code];
                        const currentScope = selected[perm.code] ?? "ALL";

                        return (
                          <div
                            key={perm.code}
                            className="space-y-2 rounded-md border p-3"
                          >
                            <label className="flex cursor-pointer items-center gap-3">
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={(v) =>
                                  togglePermission(perm.code, v === true)
                                }
                              />
                              <span className="text-sm font-medium">
                                {perm.name}
                              </span>
                              {isChecked && (
                                <Badge variant="outline" className="ml-auto">
                                  已授权
                                </Badge>
                              )}
                            </label>

                            {isChecked && (
                              <div className="ml-7">
                                {perm.scopeable ? (
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Database className="size-3.5 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                      数据范围
                                    </span>
                                    <RadioGroup
                                      value={currentScope}
                                      onValueChange={(v) =>
                                        changeScope(perm.code, v as Scope)
                                      }
                                      className="flex flex-wrap flex-row items-center gap-x-5 gap-y-2 border-0 p-0"
                                    >
                                      {SCOPE_OPTIONS.map((option) => (
                                        <label
                                          key={option.value}
                                          className="flex cursor-pointer items-center gap-1.5 text-xs"
                                        >
                                          <RadioGroupItem value={option.value} />
                                          <span>{option.label}</span>
                                        </label>
                                      ))}
                                    </RadioGroup>
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground">
                                    此权限不支持单独配置数据范围
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
              </Accordion>
            </div>
          )}
        </Card>
      </div>

      {/* 底部保存栏 */}
      <div className="mt-auto shrink-0 flex items-center justify-end gap-3 border-t bg-background/95 px-4 py-3 backdrop-blur">
        <span className="text-sm text-muted-foreground">
          已选择 {selectedCount} 项权限
        </span>

        <Button onClick={save} disabled={pending}>
          {pending ? "保存中..." : "保存权限配置"}
        </Button>
      </div>
    </div>
  );
}
