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

import { roleUsersQuerySchema } from "@/features/roles/schemas";
import { getRoleUsers } from "@/features/roles/service";
import { RoleUserAction } from "./role-user-action";

const PAGE_SIZE = 10;

type RoleUsersListProps = {
  roleId: string;
  searchParams: Promise<
    Record<string, string | string[] | undefined>
  >;
};

export async function RoleUsersList({
  roleId,
  searchParams,
}: RoleUsersListProps) {
  const params = await searchParams;
  const query = roleUsersQuerySchema.parse(params);

  const result = await getRoleUsers({
    roleId,
    page: query.page,
    pageSize: PAGE_SIZE,
    keyword: query.keyword,
  });

  if (!result) {
    return null;
  }

  const { items, total, page, totalPages } = result;

  return (
    <div className="space-y-4">
      <form className="flex gap-2">
        <Input
          name="keyword"
          defaultValue={query.keyword}
          placeholder="搜索姓名、用户名或邮箱"
          className="max-w-xs"
        />
        <Button type="submit">搜索</Button>
      </form>

      <p className="text-sm text-muted-foreground">
        当前角色共 {total} 位用户
      </p>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>姓名</TableHead>
              <TableHead>用户名</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead>手机号</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {items.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.username ?? "-"}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.phone ?? "-"}</TableCell>
                <TableCell>
                  <RoleUserAction
                    roleId={roleId}
                    userId={user.id}
                    mode="remove"
                  />
                </TableCell>
              </TableRow>
            ))}

            {items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  当前角色还没有关联用户
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ListPagination
        page={page}
        totalPages={totalPages}
        basePath={`/admin/roles/${roleId}/users`}
        params={{ keyword: query.keyword }}
      />
    </div>
  );
}
