import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";

import { RoleForm } from "@/features/roles/components/role-form";
import { getRoleById } from "@/features/roles/service";
import { requirePagePermission } from "@/lib/auth/authorization";

export const instant = false;

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditRolePage({ params }: Props) {
  await requirePagePermission("role.edit");

  const { id } = await params;
  const role = await getRoleById(id);

  if (!role) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="编辑角色"
        description="修改角色名称和说明。"
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
        <RoleForm role={role} />
      </div>
    </div>
  );
}
