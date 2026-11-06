"use client";

import { Eye } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

import { Badge } from "@/components/ui/badge";
import { USER_STATUS_LABEL } from "../constants";

type UserDetailDrawerProps = {
  user: {
    id: string;
    username: string;
    phone: string | null;
    status: "ACTIVE" | "DISABLED";
    createdAt: Date;
    updatedAt: Date;
  };
};

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Shanghai",
});

function DetailItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="text-sm font-medium">{children}</div>
    </div>
  );
}

export function UserDetailDrawer({
  user,
}: UserDetailDrawerProps) {
  const isActive = user.status === "ACTIVE";

  return (
    <Drawer>
      <DrawerTrigger
        render={
          <Button variant="ghost" size="sm">
            <Eye className="mr-1 size-4" />
            查看
          </Button>
        }
      />

      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>用户详情</DrawerTitle>
          <DrawerDescription>
            查看用户的基本资料和账号状态。
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody>
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted text-lg font-semibold">
                {user.username.slice(0, 1).toUpperCase()}
              </div>

              <div>
                <p className="font-semibold">{user.username}</p>
                <p className="text-sm text-muted-foreground">
                  用户账号
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <DetailItem label="用户名">
                {user.username}
              </DetailItem>

              <DetailItem label="手机号">
                {user.phone || "未填写"}
              </DetailItem>

              <DetailItem label="账号状态">
                <Badge variant={isActive ? "default" : "secondary"}>
                  {USER_STATUS_LABEL[user.status]}
                </Badge>
              </DetailItem>

              <DetailItem label="用户 ID">
                <span className="break-all">{user.id}</span>
              </DetailItem>

              <DetailItem label="创建时间">
                {dateFormatter.format(user.createdAt)}
              </DetailItem>

              <DetailItem label="最后更新时间">
                {dateFormatter.format(user.updatedAt)}
              </DetailItem>
            </div>
          </div>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
