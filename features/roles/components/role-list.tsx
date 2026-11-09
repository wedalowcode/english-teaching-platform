import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

  const { items, total, page, totalPages } = await getRoleList({
    page: query.page,
    pageSize: PAGE_SIZE,
    keyword,
  });

  return (
    <div className="space-y-4">
      <form className="flex gap-2">
        <Input
          name="keyword"
          defaultValue={keyword}
          placeholder="搜索角色名称或编码"
          className="max-w-xs"
        />

        <Button type="submit">搜索</Button>
      </form>

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
              <TableHead>创建时间</TableHead>
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
                  {role.createdAt.toLocaleDateString("zh-CN")}
                </TableCell>
              </TableRow>
            ))}

            {items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
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
