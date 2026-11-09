import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-8 rounded-xl border bg-card p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">启航英语</h1>

          <p className="text-sm text-muted-foreground">教学管理平台</p>
        </div>

        <LoginForm />
      </div>
    </main>
  );
}
