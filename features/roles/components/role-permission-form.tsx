"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Check,
  ChevronRight,
  Database,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

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
    description: "可以访问全部业务数据",
  },
  {
    value: "OWN",
    label: "本人数据",
    description: "仅访问本人相关数据",
  },
  {
    value: "ASSIGNED",
    label: "已分配数据",
    description: "仅访问明确分配的数据",
  },
];

const RESOURCE_LABELS: Record<string, string> = {
  portal: "系统入口",
  user: "用户管理",
  role: "角色管理",
  permission: "权限管理",
  dashboard: "经营仪表盘",
  lead: "线索管理",
  leadFollowUp: "跟进记录",
  enrollment: "报名管理",
  order: "订单管理",
  payment: "收款记录",
  student: "学生管理",
  course: "课程管理",
  schedule: "排课管理",
  teachingRecord: "教学记录",
  vocabularyRequest: "词汇申请",
  lessonLedger: "课时账本",
  teacherAssignment: "教师任务",
  teacherSettlement: "教师结算",
  parentReport: "家长报告",
};

export function RolePermissionForm({
  roleId,
  permissions,
  isSuperAdmin,
  assigned,
}: RolePermissionFormProps) {
  const [pending, startTransition] = useTransition();

  const [moduleKeyword, setModuleKeyword] = useState("");
  const [permissionKeyword, setPermissionKeyword] = useState("");

  const [activeModule, setActiveModule] = useState(
    permissions[0]?.module ?? ""
  );

  const [selected, setSelected] = useState<Record<string, Scope>>(
    Object.fromEntries(
      assigned.map((item) => [
        item.permissionCode,
        item.scope,
      ])
    )
  );

  // 模块列表
  const modules = useMemo(
    () => Array.from(new Set(permissions.map((item) => item.module))),
    [permissions]
  );

  // 模块搜索
  const visibleModules = useMemo(() => {
    const keyword = moduleKeyword.trim().toLowerCase();

    if (!keyword) return modules;

    return modules.filter((module) =>
      module.toLowerCase().includes(keyword)
    );
  }, [modules, moduleKeyword]);

  // 当前模块权限
  const currentPermissions = useMemo(() => {
    const keyword = permissionKeyword.trim().toLowerCase();

    return permissions.filter((item) => {
      if (item.module !== activeModule) return false;

      return (
        !keyword ||
        item.name.toLowerCase().includes(keyword) ||
        item.code.toLowerCase().includes(keyword) ||
        item.resource.toLowerCase().includes(keyword)
      );
    });
  }, [permissions, activeModule, permissionKeyword]);

  // 按资源分组
  const resourceGroups = useMemo(() => {
    const groups = new Map<string, Permission[]>();

    for (const item of currentPermissions) {
      const items = groups.get(item.resource) ?? [];
      items.push(item);
      groups.set(item.resource, items);
    }

    return Array.from(groups.entries());
  }, [currentPermissions]);

  // 模块统计
  function getModuleStats(module: string) {
    const items = permissions.filter(
      (item) => item.module === module
    );

    return {
      total: items.length,
      checked: items.filter((item) => item.code in selected).length,
    };
  }

  const selectedCount = Object.keys(selected).length;
  const currentStats = getModuleStats(activeModule);

  // 修改权限
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

  // 全选当前模块
  function selectCurrentModule() {
    setSelected((current) => {
      const next = { ...current };

      permissions
        .filter((item) => item.module === activeModule)
        .forEach((item) => {
          next[item.code] = next[item.code] ?? "ALL";
        });

      return next;
    });
  }

  // 清空当前模块
  function clearCurrentModule() {
    setSelected((current) => {
      const next = { ...current };

      permissions
        .filter((item) => item.module === activeModule)
        .forEach((item) => {
          delete next[item.code];
        });

      return next;
    });
  }

  // 保存权限
  function save() {
    const values = Object.entries(selected).map(
      ([code, scope]) => ({ code, scope })
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
    <div className="space-y-4">
      {/* 超级管理员提示 */}
      {isSuperAdmin && (
        <Card className="border-primary/20 bg-primary/[0.03]">
          <CardContent className="flex items-center gap-3 p-3">
            <ShieldCheck className="size-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">
                超级管理员
              </p>
              <p className="text-xs text-muted-foreground">
                系统内置权限由超级管理员身份自动获得。
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 授权统计 */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">
              已授权权限
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {selectedCount}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                项
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">
              可分配权限
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {permissions.length}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                项
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 左侧模块导航 + 右侧权限配置 */}
      <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)] md:items-start">
        {/* 模块导航 */}
        <Card className="md:sticky md:top-4">
          <CardHeader className="p-3 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                业务模块
              </CardTitle>
              <Badge variant="secondary">
                {modules.length}
              </Badge>
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={moduleKeyword}
                onChange={(event) =>
                  setModuleKeyword(event.target.value)
                }
                placeholder="搜索模块..."
                className="h-8 pl-8 text-xs"
              />
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="p-2">
            <ScrollArea className="h-[420px]">
              <div className="space-y-1 pr-2">
                {visibleModules.map((module) => {
                  const stats = getModuleStats(module);
                  const active = activeModule === module;

                  return (
                    <Button
                      key={module}
                      type="button"
                      variant={active ? "secondary" : "ghost"}
                      className={[
                        "h-auto w-full justify-between px-2.5 py-2",
                        active &&
                          "bg-primary/10 text-primary hover:bg-primary/15",
                      ].join(" ")}
                      onClick={() => {
                        setActiveModule(module);
                        setPermissionKeyword("");
                      }}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className={[
                            "size-1.5 shrink-0 rounded-full",
                            stats.checked > 0
                              ? "bg-primary"
                              : "bg-muted-foreground/30",
                          ].join(" ")}
                        />
                        <span className="truncate text-xs">
                          {module}
                        </span>
                      </span>

                      <span className="flex shrink-0 items-center gap-1">
                        <span className="text-[11px] tabular-nums text-muted-foreground">
                          {stats.checked}/{stats.total}
                        </span>
                        <ChevronRight className="size-3.5" />
                      </span>
                    </Button>
                  );
                })}

                {visibleModules.length === 0 && (
                  <p className="py-8 text-center text-xs text-muted-foreground">
                    没有匹配的模块
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* 右侧权限区域 */}
        <div className="min-w-0 space-y-3">
          {/* 模块工具栏 */}
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-3">
              <div>
                <h2 className="text-base font-semibold">
                  {activeModule || "权限配置"}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  当前模块已授权 {currentStats.checked} / {currentStats.total} 项
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={selectCurrentModule}
                  disabled={!activeModule}
                >
                  全选
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={clearCurrentModule}
                  disabled={!activeModule || currentStats.checked === 0}
                >
                  清空
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 权限搜索 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={permissionKeyword}
              onChange={(event) =>
                setPermissionKeyword(event.target.value)
              }
              placeholder="搜索权限名称、编码或资源..."
              className="h-9 pl-9"
            />
          </div>

          {/* 资源权限分组 */}
          {resourceGroups.length > 0 ? (
            <Accordion
              multiple
              defaultValue={
                resourceGroups.length > 0
                  ? [resourceGroups[0][0]]
                  : []
              }
              className="space-y-2"
            >
              {resourceGroups.map(([resource, items]) => {
                const checkedCount = items.filter(
                  (item) => item.code in selected
                ).length;

                return (
                  <AccordionItem
                    key={resource}
                    value={resource}
                    className="overflow-hidden rounded-lg border bg-card"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:no-underline [&>svg]:size-4">
                      <div className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-sm font-medium">
                            {RESOURCE_LABELS[resource] ?? resource}
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {items.length} 项操作
                          </span>
                        </div>

                        <Badge variant="outline">
                          {checkedCount}/{items.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="pb-0">
                      <Separator />

                      <div className="divide-y">
                        {items.map((item) => {
                          const checked = item.code in selected;

                          return (
                            <div
                              key={item.code}
                              className="px-4 py-3"
                            >
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(value) =>
                                    togglePermission(
                                      item.code,
                                      value === true
                                    )
                                  }
                                />

                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm">
                                      {item.name}
                                    </span>

                                    {checked && (
                                      <Badge variant="secondary">
                                        <Check className="size-3" />
                                        已授权
                                      </Badge>
                                    )}
                                  </div>

                                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                                    {item.code}
                                  </p>
                                </div>
                              </div>

                              {/* 数据范围 */}
                              {checked && item.scopeable && (
                                <div className="ml-7 mt-3 rounded-md bg-muted/30 p-3">
                                  <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                    <Database className="size-3.5" />
                                    数据范围
                                  </div>

                                  <RadioGroup
                                    value={selected[item.code]}
                                    onValueChange={(value) =>
                                      changeScope(
                                        item.code,
                                        value as Scope
                                      )
                                    }
                                    className="flex flex-wrap gap-x-5 gap-y-2"
                                  >
                                    {SCOPE_OPTIONS.map((option) => {
                                      const id = `scope-${item.code}-${option.value}`;

                                      return (
                                        <div
                                          key={option.value}
                                          className="flex items-center gap-2"
                                        >
                                          <RadioGroupItem
                                            id={id}
                                            value={option.value}
                                          />
                                          <label
                                            htmlFor={id}
                                            className="cursor-pointer text-xs"
                                          >
                                            {option.label}
                                          </label>
                                        </div>
                                      );
                                    })}
                                  </RadioGroup>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center py-12 text-center">
                <Search className="size-7 text-muted-foreground/50" />
                <p className="mt-3 text-sm font-medium">
                  没有找到匹配的权限
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  请调整搜索关键词
                </p>

                {permissionKeyword && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="mt-2"
                    onClick={() => setPermissionKeyword("")}
                  >
                    <X className="size-4" />
                    清除搜索
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* 底部保存区域 */}
      <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t bg-background/95 py-3 backdrop-blur">
        <div className="text-sm text-muted-foreground">
          已选择
          <span className="mx-1 font-semibold text-foreground">
            {selectedCount}
          </span>
          项权限
        </div>

        <Button onClick={save} disabled={pending}>
          {pending ? "正在保存..." : "保存权限配置"}
        </Button>
      </div>
    </div>
  );
}
