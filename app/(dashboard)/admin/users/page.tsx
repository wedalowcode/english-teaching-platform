import Link from "next/link";
import { Suspense } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { getMenuBreadcrumb } from "@/components/layout/menu-config";
import {
  UserList,
  UserListSkeleton,
} from "@/features/users/components/user-list";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function UsersPage({ searchParams }: Props) {
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
