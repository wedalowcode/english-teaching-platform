import Link from "next/link";
import { Suspense } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { getMenuBreadcrumb } from "@/components/layout/menu-config";
import {
  UserList,
  UserListSkeleton,
} from "@/features/users/components/user-list";
import { requireCurrentUser } from "@/server/auth/session";

// 会话校验需要阻塞渲染，先确认身份再输出页面数据
export const instant = false;

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function UsersPage({ searchParams }: Props) {
  await requireCurrentUser();

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={getMenuBreadcrumb("/admin/users")}
        title="用户管理"
        description="管理系统用户账号、状态及登录信息。"
        actions={
          <Link href="/admin/users/new" className={buttonVariants()}>
            新增用户
          </Link>
        }
      />

      <Suspense fallback={<UserListSkeleton />}>
        <UserList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
