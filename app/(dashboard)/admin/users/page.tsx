import Link from "next/link";
import { Suspense } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import {
  UserList,
  UserListSkeleton,
} from "@/features/users/components/user-list";
import {
  evaluatePermission,
  requirePagePermission,
} from "@/lib/auth/authorization";

// 会话校验需要阻塞渲染，先确认身份再输出页面数据
export const instant = false;

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function UsersPage({ searchParams }: Props) {
  const actor = await requirePagePermission("user.view");

  const canCreate = evaluatePermission("user.create", actor).allowed;

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <PageHeader
        title="用户管理"
        description="管理系统用户账号、状态及登录信息。"
        actions={
          canCreate ? (
            <Link href="/admin/users/new" className={buttonVariants()}>
              新增用户
            </Link>
          ) : undefined
        }
      />

      <Suspense fallback={<UserListSkeleton />}>
        <UserList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
