import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { UserCreateForm } from "@/features/users/components/user-create-form";

export default function NewUserPage() {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-end justify-between">
        <div>
          <div className="mb-1 text-xs text-slate-500">
            系统设置 / 用户管理 / 新增用户
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[#172033]">
            新增用户
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            创建新的系统用户账号并分配登录信息。
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
      <div className="max-w-xl">
        <UserCreateForm />
      </div>
    </div>
  );
}
