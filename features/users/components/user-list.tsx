import Link from "next/link";
import Form from "next/form";
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
import { evaluatePermission } from "@/lib/auth/authorization";
import { getCurrentActor } from "@/lib/auth/current-actor";
import type { PermissionCode } from "@/lib/auth/permissions";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import {
  USER_STATUS_BADGE_VARIANT,
  USER_STATUS_LABEL,
  formatUserDate,
} from "@/features/users/constants";
import { userListQuerySchema } from "@/features/users/schemas";
import { getRoleOptions, getUserList } from "@/features/users/service";
import { UserAccountActions } from "./user-account-actions";
import { UserDetailDrawer } from "./user-detail-drawer";

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
  const status = query.status;
  const created = params.created === "1";
  const updated = params.updated === "1";

  const actor = await getCurrentActor();

  const can = (permission: PermissionCode) =>
    actor ? evaluatePermission(permission, actor).allowed : false;

  const [result, roles] = await Promise.all([
    getUserList({
      page: query.page,
      pageSize: query.pageSize,
      keyword,
      status,
    }),
    getRoleOptions(),
  ]);

  const { items, total, page, totalPages } = result;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
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

      {/* next/form 走客户端导航，避免原生提交整页刷新导致侧边栏闪一下 */}
      <Form action="/admin/users" className="flex shrink-0 flex-wrap gap-2">
        <Input
          // URL 变化时强制重挂载，否则非受控输入框的 defaultValue 不会更新。
          // key 需在兄弟节点间唯一，否则 React 会复用错元素
          key={`keyword-${keyword}`}
          name="keyword"
          defaultValue={keyword}
          placeholder="搜索姓名、用户名、邮箱或手机号"
          className="max-w-xs"
        />

        <select
          key={`status-${status ?? ""}`}
          name="status"
          defaultValue={status ?? ""}
          aria-label="按状态筛选"
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">全部状态</option>

          {Object.entries(USER_STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <Button type="submit">搜索</Button>

        <Link
          href="/admin/users"
          className={buttonVariants({ variant: "outline" })}
        >
          重置
        </Link>
      </Form>

      <p className="shrink-0 text-sm text-muted-foreground">共 {total} 位用户</p>

      <div className="min-h-0 flex-1 overflow-auto rounded-md border bg-card">
        {/* 内层不再滚动，让外层容器同时负责横纵滚动，表头才能 sticky 在顶部 */}
        <Table className="min-w-[900px]" containerClassName="overflow-visible">
          <TableHeader>
            <TableRow>
              <TableHead>用户</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead>手机号</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="sticky right-0 z-20 border-l bg-card text-right">
                操作
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {items.map((user) => {
              const variant = USER_STATUS_BADGE_VARIANT[user.status];

              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {user.username ?? "未设置用户名"}
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant={variant}>
                      {USER_STATUS_LABEL[user.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatUserDate(user.createdAt)}</TableCell>
                  <TableCell className="sticky right-0 z-10 border-l bg-card text-right">
                    <div className="flex flex-wrap justify-end gap-1">
                      <UserDetailDrawer user={user} />

                      {/* 没有编辑权限就不显示入口，避免点进去再被 403 拦回 */}
                      {can("user.edit") && (
                        <Link
                          href={`/admin/users/${user.id}/edit`}
                          className={buttonVariants({
                            variant: "outline",
                            size: "sm",
                          })}
                        >
                          编辑
                        </Link>
                      )}

                      <UserAccountActions
                        userId={user.id}
                        username={user.username ?? user.name}
                        status={user.status}
                        roles={roles}
                        assignedRoleIds={user.userRoles.map(
                          (item) => item.roleId
                        )}
                        canResetPassword={can("user.resetPassword")}
                        canAssignRole={can("user.assignRole")}
                        canDisable={can("user.disable")}
                        canDelete={can("user.delete")}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}

            {items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
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
        pageSize={query.pageSize}
        params={{ keyword, status }}
      />
    </div>
  );
}

export function UserListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-16" />
      </div>

      <Skeleton className="h-4 w-24" />

      <div className="space-y-2 rounded-md border p-4">
        {Array.from({ length: DEFAULT_PAGE_SIZE }, (_, i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </div>

      <Skeleton className="h-8 w-48" />
    </div>
  );
}
