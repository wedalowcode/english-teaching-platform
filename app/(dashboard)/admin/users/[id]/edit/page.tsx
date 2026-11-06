import Link from "next/link";
import { Suspense } from "react";

import { buttonVariants } from "@/components/ui/button";
import { UserEdit, UserEditSkeleton } from "@/features/users/components/user-edit";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default function EditUserPage({ params }: Props) {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-end justify-between">
        <div>
          <div className="mb-1 text-xs text-slate-500">
            系统设置 / 用户管理 / 编辑用户
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[#172033]">
            编辑用户
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            修改用户账号信息。
          </p>
        </div>

        <Link
          href="/admin/users"
          className={buttonVariants({ variant: "outline" })}
        >
          返回用户列表
        </Link>
      </div>

      {/* 业务内容 */}
      <Suspense fallback={<UserEditSkeleton />}>
        <UserEdit params={params} />
      </Suspense>
    </div>
  );
}
