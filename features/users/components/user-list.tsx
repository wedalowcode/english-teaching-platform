import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ListPagination } from "@/components/shared/list-pagination";
import {
  USER_STATUS_BADGE_VARIANT,
  USER_STATUS_LABEL,
  formatUserDate,
} from "@/features/users/constants";
import { userListQuerySchema } from "@/features/users/schemas";
import { getUserList } from "@/features/users/service";
import { UserAccountActions } from "./user-account-actions";
import { UserDetailDrawer } from "./user-detail-drawer";

const PAGE_SIZE = 10;

export type UserListSearchParams = Promise<
  Record<string, string | string[] | undefined>
>;

export async function UserList({
  searchParams,
}: {
  searchParams: UserListSearchParams;
}) {
  const params = await searchParams;

  const query = userListQuerySchema.parse(params);
  const keyword = query.keyword;
  const created = params.created === "1";
  const updated = params.updated === "1";

  const { items, total, page, totalPages } = await getUserList({
    page: query.page,
    pageSize: PAGE_SIZE,
    keyword,
  });

  return (
    <div className="space-y-4">
      {created && (
        <p role="status" className="text-sm text-green-600">
          用户创建成功
        </p>
      )}

      {updated && (
        <p role="status" className="text-sm text-green-600">
          用户资料修改成功
        </p>
      )}

      <form className="flex gap-2">
        <Input
          name="keyword"
          defaultValue={keyword}
          placeholder="搜索用户名或手机号"
          className="max-w-xs"
        />
        <Button type="submit">搜索</Button>
      </form>

      <p className="text-sm text-muted-foreground">共 {total} 位用户</p>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>用户名</TableHead>
              <TableHead>手机号</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {items.map((user) => {
              const variant = USER_STATUS_BADGE_VARIANT[user.status];

              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.phone ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant={variant}>
                      {USER_STATUS_LABEL[user.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatUserDate(user.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-1">
                      <UserDetailDrawer user={user} />

                      <Link
                        href={`/admin/users/${user.id}/edit`}
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                        })}
                      >
                        编辑
                      </Link>

                      <UserAccountActions
                        userId={user.id}
                        username={user.username}
                        status={user.status}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}

            {items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  暂无用户数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ListPagination
        page={page}
        totalPages={totalPages}
        basePath="/admin/users"
        params={{ keyword }}
      />
    </div>
  );
}

export function UserListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-16" />
      </div>

      <Skeleton className="h-4 w-24" />

      <div className="space-y-2 rounded-md border p-4">
        {Array.from({ length: PAGE_SIZE }, (_, i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </div>

      <Skeleton className="h-8 w-48" />
    </div>
  );
}
