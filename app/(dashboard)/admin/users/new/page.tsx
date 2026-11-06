import Link from "next/link";
import { UserCreateForm } from "@/features/users/components/user-create-form";

export default function NewUserPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/users" className="text-sm text-muted-foreground">
          返回用户列表
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">新增用户</h1>
      </div>

      <div className="max-w-xl">
        <UserCreateForm />
      </div>
    </div>
  );
}