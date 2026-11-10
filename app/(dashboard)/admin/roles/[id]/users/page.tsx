import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { getMenuBreadcrumb } from "@/components/layout/menu-config";
import { buttonVariants } from "@/components/ui/button";

import { requirePagePermission } from "@/lib/auth/authorization";
import { getRoleById } from "@/features/roles/service";
import { RoleUsersList } from "@/features/roles/components/role-users-list";

export const instant = false;

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<
    Record<string, string | string[] | undefined>
  >;
};

export default async function RoleUsersPage({
  params,
  searchParams,
}: Props) {
  await requirePagePermission("role.assignUser");

  const { id: roleId } = await params;
  const role = await getRoleById(roleId);

  if (!role) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[
          ...getMenuBreadcrumb("/admin/roles"),
          role.name,
          "用户管理",
        ]}
        title={`${role.name} · 用户管理`}
        description="管理当前角色下的用户成员。"
        actions={
          <Link
            href={`/admin/roles/${roleId}/users/add`}
            className={buttonVariants()}
          >
            添加用户
          </Link>
        }
      />

      <RoleUsersList roleId={roleId} searchParams={searchParams} />
    </div>
  );
}
