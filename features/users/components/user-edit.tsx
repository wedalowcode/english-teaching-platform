import { notFound } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { getUserById } from "../service";
import { UserEditForm } from "./user-edit-form";

type UserEditProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function UserEdit({ params }: UserEditProps) {
  const { id } = await params;

  const user = await getUserById(id);

  if (!user) {
    notFound();
  }

  return (
    <div className="max-w-xl space-y-8">
      <section className="space-y-4">
        <h2 className="text-base font-semibold">基本资料</h2>
        <UserEditForm user={user} />
      </section>
    </div>
  );
}

export function UserEditSkeleton() {
  return (
    <div className="max-w-xl space-y-4">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
