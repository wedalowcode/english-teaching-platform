import { PageHeader } from "@/components/shared/page-header";
import { getMenuBreadcrumb } from "@/components/layout/menu-config";

import { RoleList } from "@/features/roles/components/role-list";

import { requirePagePermission } from "@/lib/auth/authorization";

// 会话校验需要阻塞渲染
export const instant = false;

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RolesPage({ searchParams }: Props) {
  await requirePagePermission("role.view");

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={getMenuBreadcrumb("/admin/roles")}
        title="角色管理"
        description="管理系统角色及其关联用户。"
      />

      <RoleList searchParams={searchParams} />
    </div>
  );
}
