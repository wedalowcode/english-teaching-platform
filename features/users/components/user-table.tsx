import type { UserStatus } from "@/app/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { USER_STATUS_LABEL } from "@/features/users/constants";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { getUserList } from "@/features/users/service";

type UserListItem = Awaited<ReturnType<typeof getUserList>>["items"][number];

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

export function UserTable({ users }: { users: UserListItem[] }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>用户名</TableHead>
            <TableHead>手机号</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>创建时间</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {users.map((user) => {
            const status = STATUS_META[user.status];

            return (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>{user.phone ?? "-"}</TableCell>
                <TableCell>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </TableCell>
                <TableCell>{dateFormatter.format(user.createdAt)}</TableCell>
              </TableRow>
            );
          })}

          {users.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={4}
                className="h-24 text-center text-muted-foreground"
              >
                暂无用户数据
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}