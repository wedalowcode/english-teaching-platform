import Link from "next/link";
import Form from "next/form";

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

import { roleUsersQuerySchema } from "@/features/roles/schemas";
import { getAvailableRoleUsers } from "@/features/roles/service";
import { RoleUserAction } from "./role-user-action";

type AvailableRoleUsersListProps = {
  roleId: string;
  searchParams: Promise<
    Record<string, string | string[] | undefined>
  >;
};

export async function AvailableRoleUsersList({
  roleId,
  searchParams,
}: AvailableRoleUsersListProps) {
  const params = await searchParams;
  const query = roleUsersQuerySchema.parse(params);

  const { items, total, page, totalPages } = await getAvailableRoleUsers({
    roleId,
    page: query.page,
    pageSize: query.pageSize,
    keyword: query.keyword,
  });

  return (
    <div className="space-y-4">
      {/* next/form 走客户端导航，避免原生提交整页刷新导致侧边栏闪一下 */}
      <Form
        action={`/admin/roles/${roleId}/users/add`}
        className="flex gap-2"
      >
        <Input
          // URL 变化时强制重挂载，否则非受控输入框的 defaultValue 不会更新
          key={query.keyword}
          name="keyword"
          defaultValue={query.keyword}
          placeholder="搜索姓名、用户名或邮箱"
          className="max-w-xs"
        />
        <Button type="submit">搜索</Button>

        <Link
          href={`/admin/roles/${roleId}/users/add`}
          className={buttonVariants({ variant: "outline" })}
        >
          重置
        </Link>
      </Form>

      <p className="text-sm text-muted-foreground">
        共 {total} 位候选用户
      </p>

      <div className="rounded-md border bg-card">
        <Table className="min-w-[680px]">
          <TableHeader>
            <TableRow>
              <TableHead>姓名</TableHead>
              <TableHead>用户名</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead className="sticky right-0 z-20 border-l bg-card">
                操作
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {items.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.username ?? "-"}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell className="sticky right-0 z-10 border-l bg-card">
                  <RoleUserAction
                    roleId={roleId}
                    userId={user.id}
                    mode="add"
                  />
                </TableCell>
              </TableRow>
            ))}

            {items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground"
                >
                  没有可添加的用户，所有用户都已加入该角色
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ListPagination
        page={page}
        totalPages={totalPages}
        basePath={`/admin/roles/${roleId}/users/add`}
        pageSize={query.pageSize}
        params={{ keyword: query.keyword }}
      />
    </div>
  );
}
