import Link from "next/link";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import {
  UserList,
  UserListSkeleton,
} from "@/features/users/components/user-list";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function UsersPage({ searchParams }: Props) {
  return (
    <main className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">用户管理</h1>
        <Link href="/admin/users/new" className={buttonVariants()}>
          新增用户
        </Link>
      </div>

      <Suspense fallback={<UserListSkeleton />}>
        <UserList searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
