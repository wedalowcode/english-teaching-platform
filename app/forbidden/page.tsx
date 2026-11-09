import Link from "next/link";

export const metadata = {
  title: "无权访问",
};

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-4 rounded-xl border bg-card p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold">无权访问</h1>

        <p className="text-sm text-muted-foreground">
          当前账号没有管理员权限，请联系系统管理员。
        </p>

        <Link
          href="/"
          className="inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          返回首页
        </Link>
      </div>
    </main>
  );
}
