import Link from "next/link";
import { notFound } from "next/navigation";

import { getMenuBreadcrumb } from "@/components/layout/menu-config";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { RolePermissionForm } from "@/features/roles/components/role-permission-form";
import { getRolePermissionConfig } from "@/features/roles/service";

// 权限配置需要实时读取数据库授权状态
export const instant = false;

export default async function RolePermissionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getRolePermissionConfig(id);

  if (!result) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[
          ...getMenuBreadcrumb("/admin/roles"),
          result.role.name,
          "分配权限",
        ]}
        title="分配角色权限"
        description={`正在配置角色：${result.role.name}`}
        actions={
          <Link
            href="/admin/roles"
            className={buttonVariants({ variant: "outline" })}
          >
            返回角色列表
          </Link>
        }
      />

      <RolePermissionForm
        roleId={id}
        permissions={result.permissions}
        assigned={result.assigned}
        isSuperAdmin={result.isSuperAdmin}
      />
    </div>
  );
}
