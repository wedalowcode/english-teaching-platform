"use client";

import type { ReactNode } from "react";

import { Eye } from "lucide-react";

import type { UserStatus } from "@/app/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  USER_STATUS_BADGE_VARIANT,
  USER_STATUS_LABEL,
  formatUserDate,
} from "@/features/users/constants";

type UserDetailDrawerProps = {
  user: {
    id: string;
    name: string;
    email: string;
    username: string | null;
    phone: string | null;
    status: UserStatus;
    createdAt: Date;
    updatedAt: Date;
  };
};

function DetailItem({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="text-sm font-medium">{children}</div>
    </div>
  );
}

export function UserDetailDrawer({ user }: UserDetailDrawerProps) {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="ghost" size="sm" />}>
        <Eye className="mr-1 size-4" />
        查看
      </SheetTrigger>

      <SheetContent side="right">
        <SheetHeader className="p-6 pr-12 pb-4">
          <SheetTitle>用户详情</SheetTitle>
          <SheetDescription>
            查看用户的基本资料和账号状态。
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-6 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-lg font-semibold">
              {user.name.slice(0, 1).toUpperCase()}
            </div>

            <div>
              <p className="font-semibold">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <DetailItem label="用户名">
              {user.username || "未设置"}
            </DetailItem>

            <DetailItem label="邮箱">{user.email}</DetailItem>

            <DetailItem label="手机号">{user.phone || "未填写"}</DetailItem>

            <DetailItem label="账号状态">
              <Badge variant={USER_STATUS_BADGE_VARIANT[user.status]}>
                {USER_STATUS_LABEL[user.status]}
              </Badge>
            </DetailItem>

            <DetailItem label="用户 ID">
              <span className="break-all">{user.id}</span>
            </DetailItem>

            <DetailItem label="创建时间">
              {formatUserDate(user.createdAt)}
            </DetailItem>

            <DetailItem label="最后更新时间">
              {formatUserDate(user.updatedAt)}
            </DetailItem>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
