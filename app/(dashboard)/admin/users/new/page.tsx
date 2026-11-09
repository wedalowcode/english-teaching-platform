import Link from "next/link";

import { getMenuBreadcrumb } from "@/components/layout/menu-config";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { UserCreateForm } from "@/features/users/components/user-create-form";
import { requireCurrentUser } from "@/server/auth/session";

// 会话校验需要阻塞渲染，先确认身份再输出页面
export const instant = false;

export default async function NewUserPage() {
  await requireCurrentUser();

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[...getMenuBreadcrumb("/admin/users"), "新增用户"]}
        title="新增用户"
        description="创建新的系统用户账号并分配登录信息。"
        actions={
          <Link
            href="/admin/users"
            className={buttonVariants({ variant: "outline" })}
          >
            返回用户列表
          </Link>
        }
      />

      <div className="max-w-xl">
        <UserCreateForm />
      </div>
    </div>
  );
}
