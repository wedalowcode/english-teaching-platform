import Link from "next/link";
import { Suspense } from "react";

import { buttonVariants } from "@/components/ui/button";

import { UserEdit, UserEditSkeleton } from "@/features/users/components/user-edit";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default function EditUserPage({ params }: Props) {
  return (
    <main className="space-y-6 p-6">
      <div>
        <Link
          href="/admin/users"
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
          })}
        >
          返回用户列表
        </Link>

        <h1 className="mt-2 text-2xl font-semibold">编辑用户</h1>
      </div>

      <Suspense fallback={<UserEditSkeleton />}>
        <UserEdit params={params} />
      </Suspense>
    </main>
  );
}
