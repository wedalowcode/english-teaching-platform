import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";

import { RoleList } from "@/features/roles/components/role-list";

import {
  evaluatePermission,
  requirePagePermission,
} from "@/lib/auth/authorization";

// 会话校验需要阻塞渲染
export const instant = false;

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RolesPage({ searchParams }: Props) {
  const actor = await requirePagePermission("role.view");

  const canCreate = evaluatePermission("role.create", actor).allowed;

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <PageHeader
        title="角色管理"
        description="管理系统角色及其关联用户。"
        actions={
          canCreate ? (
            <Link href="/admin/roles/new" className={buttonVariants()}>
              新增角色
            </Link>
          ) : undefined
        }
      />

      <RoleList searchParams={searchParams} />
    </div>
  );
}
