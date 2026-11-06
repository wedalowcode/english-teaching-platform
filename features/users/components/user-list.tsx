import Link from "next/link";
import type { UserStatus } from "@/app/generated/prisma/client";
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
import { USER_STATUS_LABEL } from "@/features/users/constants";
import { userListQuerySchema } from "@/features/users/schemas";
import { getUserList } from "@/features/users/service";
import { UserAccountActions } from "./user-account-actions";
import { UserDetailDrawer } from "./user-detail-drawer";

const PAGE_SIZE = 10;

const STATUS_META: Record<
  UserStatus,
  { label: string; variant: "default" | "secondary" }
> = {
  ACTIVE: { label: USER_STATUS_LABEL.ACTIVE, variant: "default" },
  DISABLED: { label: USER_STATUS_LABEL.DISABLED, variant: "secondary" },
};

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Shanghai",
});

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
  const passwordReset = params.passwordReset === "1";
  const statusChanged = params.statusChanged === "1";
  const deleted = params.deleted === "1";
  const error = params.error;

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

      {passwordReset && (
        <p role="status" className="text-sm text-green-600">
          用户密码重置成功
        </p>
      )}

      {statusChanged && (
        <p role="status" className="text-sm text-green-600">
          用户状态修改成功
        </p>
      )}

      {deleted && (
        <p role="status" className="text-sm text-green-600">
          用户删除成功
        </p>
      )}

      {error === "user-not-found" && (
        <p role="alert" className="text-sm text-destructive">
          用户不存在或已被删除，请刷新列表后重试
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

      <div className="rounded-md border">
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
              const status = STATUS_META[user.status];

              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.phone ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </TableCell>
                  <TableCell>{dateFormatter.format(user.createdAt)}</TableCell>
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

                      <UserAccountActions user={user} />
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
