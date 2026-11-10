import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";

import { requirePagePermission } from "@/lib/auth/authorization";
import { getRoleById } from "@/features/roles/service";
import { AvailableRoleUsersList } from "@/features/roles/components/available-role-users-list";

export const instant = false;

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<
    Record<string, string | string[] | undefined>
  >;
};

export default async function AddRoleUsersPage({
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
        title={`为「${role.name}」添加用户`}
        description="这里只显示尚未加入该角色的用户。"
        actions={
          <Link
            href={`/admin/roles/${roleId}/users`}
            className={buttonVariants({ variant: "outline" })}
          >
            返回用户列表
          </Link>
        }
      />

      <AvailableRoleUsersList roleId={roleId} searchParams={searchParams} />
    </div>
  );
}
