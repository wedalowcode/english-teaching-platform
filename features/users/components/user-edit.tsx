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
    <div className="max-w-xl">
      <UserEditForm user={user} />
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
      <Skeleton className="h-10 w-28" />
    </div>
  );
}
