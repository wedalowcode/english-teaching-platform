import Link from "next/link";

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

import { roleListQuerySchema } from "@/features/roles/schemas";
import { getRoleList } from "@/features/roles/service";
import { RoleAccountActions } from "./role-account-actions";

const PAGE_SIZE = 10;

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
  const created = params.created === "1";
  const updated = params.updated === "1";

  const { items, total, page, totalPages } = await getRoleList({
    page: query.page,
    pageSize: PAGE_SIZE,
    keyword,
  });

  return (
    <div className="space-y-4">
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

      <div className="flex flex-wrap items-center justify-between gap-2">
        <form className="flex gap-2">
          <Input
            name="keyword"
            defaultValue={keyword}
            placeholder="搜索角色名称或编码"
            className="max-w-xs"
          />

          <Button type="submit">搜索</Button>
        </form>

        <Link href="/admin/roles/new" className={buttonVariants()}>
          新增角色
        </Link>
      </div>

      <p className="text-sm text-muted-foreground">共 {total} 个角色</p>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>角色名称</TableHead>
              <TableHead>角色编码</TableHead>
              <TableHead>角色说明</TableHead>
              <TableHead>关联用户</TableHead>
              <TableHead>角色类型</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
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
                  {role.createdAt.toLocaleDateString("zh-CN")}
                </TableCell>

                <TableCell className="text-right">
                  <RoleAccountActions
                    roleId={role.id}
                    isActive={role.isActive}
                    isSystem={role.isSystem}
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
        params={{ keyword }}
      />
    </div>
  );
}
