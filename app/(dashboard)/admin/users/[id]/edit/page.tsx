import Link from "next/link";
import { Suspense } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { UserEdit, UserEditSkeleton } from "@/features/users/components/user-edit";
import { requirePagePermission } from "@/lib/auth/authorization";

// 会话校验需要阻塞渲染，先确认身份再输出页面数据
export const instant = false;

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditUserPage({ params }: Props) {
  await requirePagePermission("user.edit");

  return (
    <div className="space-y-6">
      <PageHeader
        title="编辑用户"
        description="修改用户账号信息。"
        actions={
          <Link
            href="/admin/users"
            className={buttonVariants({ variant: "outline" })}
          >
            返回用户列表
          </Link>
        }
      />

      <Suspense fallback={<UserEditSkeleton />}>
        <UserEdit params={params} />
      </Suspense>
    </div>
  );
}
