import Link from "next/link";

import { getMenuBreadcrumb } from "@/components/layout/menu-config";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";

import { RoleForm } from "@/features/roles/components/role-form";
import { requirePagePermission } from "@/lib/auth/authorization";

export const instant = false;

export default async function NewRolePage() {
  await requirePagePermission("role.create");

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[...getMenuBreadcrumb("/admin/roles"), "新增角色"]}
        title="新增角色"
        description="创建自定义角色，后续可以为角色分配用户和权限。"
        actions={
          <Link
            href="/admin/roles"
            className={buttonVariants({ variant: "outline" })}
          >
            返回角色列表
          </Link>
        }
      />

      <div className="max-w-xl">
        <RoleForm />
      </div>
    </div>
  );
}
