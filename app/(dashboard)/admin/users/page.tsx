import Link from "next/link";
import { Suspense } from "react";

import { buttonVariants } from "@/components/ui/button";
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
      {/* 页面标题 */}
      <div className="flex items-end justify-between">
        <div>
          <div className="mb-1 text-xs text-slate-500">
            系统设置 / 用户管理
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[#172033]">
            用户管理
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            管理系统用户账号、状态及登录信息。
          </p>
        </div>

        <Link
          href="/admin/users/new"
          className={buttonVariants({
            className: "bg-[#2563EB] text-white hover:bg-blue-700",
          })}
        >
          新增用户
        </Link>
      </div>

      {/* 业务内容 */}
      <Suspense fallback={<UserListSkeleton />}>
        <UserList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
