import Link from "next/link";
import Form from "next/form";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { ListPagination } from "@/components/shared/list-pagination";
import { evaluatePermission } from "@/lib/auth/authorization";
import { getCurrentActor } from "@/lib/auth/current-actor";
import type { PermissionCode } from "@/lib/auth/permissions";
import { formatDateTime } from "@/lib/date";

import { roleListQuerySchema } from "@/features/roles/schemas";
import { getRoleList } from "@/features/roles/service";
import { RoleAccountActions } from "./role-account-actions";

const ROLE_TYPE_OPTIONS = [
  { value: "SYSTEM", label: "系统角色" },
  { value: "CUSTOM", label: "自定义角色" },
];

const ROLE_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "启用" },
  { value: "DISABLED", label: "停用" },
];

const FILTER_SELECT_CLASS =
  "h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type RoleListSearchParams = Promise<
  Record<string, string | string[] | undefined>
>;

export async function RoleList({
  searchParams,
}: {
  searchParams: RoleListSearchParams;
}) {
  const params = await searchParams;

  const query = roleListQuerySchema.parse(params);

  const keyword = query.keyword;
  const type = query.type;
  const status = query.status;
  const created = params.created === "1";
  const updated = params.updated === "1";

  const actor = await getCurrentActor();

  const can = (permission: PermissionCode) =>
    actor ? evaluatePermission(permission, actor).allowed : false;

  const { items, total, page, totalPages } = await getRoleList({
    page: query.page,
    pageSize: query.pageSize,
    keyword,
    type,
    status,
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {created && (
        <p role="status" className="text-sm text-green-600">
          角色创建成功
        </p>
      )}

      {updated && (
        <p role="status" className="text-sm text-green-600">
          角色修改成功
        </p>
      )}

      {/* next/form 走客户端导航，避免原生提交整页刷新导致侧边栏闪一下 */}
      <Form action="/admin/roles" className="flex shrink-0 flex-wrap gap-2">
        <Input
          // URL 变化时强制重挂载，否则非受控输入框的 defaultValue 不会更新。
          // key 需在兄弟节点间唯一，否则 React 会复用错元素
          key={`keyword-${keyword}`}
          name="keyword"
          defaultValue={keyword}
          placeholder="搜索角色名称或编码"
          className="max-w-xs"
        />

        <select
          key={`type-${type ?? ""}`}
          name="type"
          defaultValue={type ?? ""}
          aria-label="按角色类型筛选"
          className={FILTER_SELECT_CLASS}
        >
          <option value="">全部类型</option>

          {ROLE_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          key={`status-${status ?? ""}`}
          name="status"
          defaultValue={status ?? ""}
          aria-label="按状态筛选"
          className={FILTER_SELECT_CLASS}
        >
          <option value="">全部状态</option>

          {ROLE_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <Button type="submit">搜索</Button>

        <Link
          href="/admin/roles"
          className={buttonVariants({ variant: "outline" })}
        >
          重置
        </Link>
      </Form>

      <p className="shrink-0 text-sm text-muted-foreground">共 {total} 个角色</p>

      <div className="min-h-0 flex-1 overflow-auto rounded-md border bg-card">
        {/* 内层不再滚动，让外层容器同时负责横纵滚动，表头才能 sticky 在顶部 */}
        <Table className="min-w-[1080px]" containerClassName="overflow-visible">
          <TableHeader>
            <TableRow>
              <TableHead>角色名称</TableHead>
              <TableHead>角色编码</TableHead>
              <TableHead>角色说明</TableHead>
              <TableHead>关联用户</TableHead>
              <TableHead>角色类型</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="sticky right-0 z-20 border-l bg-card text-right">
                操作
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {items.map((role) => (
              <TableRow key={role.id}>
                <TableCell className="font-medium">{role.name}</TableCell>

                <TableCell>
                  <code className="text-sm">{role.code}</code>
                </TableCell>

                <TableCell>{role.description ?? "-"}</TableCell>

                <TableCell>{role._count.userRoles}</TableCell>

                <TableCell>
                  {role.isSystem ? (
                    <Badge variant="secondary">系统角色</Badge>
                  ) : (
                    <Badge variant="outline">自定义角色</Badge>
                  )}
                </TableCell>

                <TableCell>
                  <Badge variant={role.isActive ? "secondary" : "outline"}>
                    {role.isActive ? "启用" : "停用"}
                  </Badge>
                </TableCell>

                <TableCell>
                  {formatDateTime(role.createdAt)}
                </TableCell>

                <TableCell className="sticky right-0 z-10 border-l bg-card text-right">
                  <RoleAccountActions
                    roleId={role.id}
                    isActive={role.isActive}
                    isSystem={role.isSystem}
                    canEdit={can("role.edit")}
                    canDisable={can("role.disable")}
                    canAssignUser={can("role.assignUser")}
                    canAssignPermissions={can("role.assignPermissions")}
                  />
                </TableCell>
              </TableRow>
            ))}

            {items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  暂无角色数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ListPagination
        page={page}
        totalPages={totalPages}
        basePath="/admin/roles"
        pageSize={query.pageSize}
        params={{ keyword, type, status }}
      />
    </div>
  );
}
