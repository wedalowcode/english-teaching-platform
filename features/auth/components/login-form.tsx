"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export function LoginForm() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result = await authClient.signIn.username({
        username,
        password,
      });

      if (result.error) {
        // 用户名或密码错误统一提示，避免泄露账号是否存在。
        // 账号停用的提示只有在密码校验通过后才会出现，可以原样展示。
        const isCredentialError =
          result.error.code === "INVALID_USERNAME_OR_PASSWORD";

        setError(
          isCredentialError
            ? "用户名或密码错误"
            : result.error.message || "登录失败，请稍后重试"
        );
        return;
      }

      router.replace("/admin/users");
      router.refresh();
    } catch {
      setError("登录失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="username">用户名</Label>

        <Input
          id="username"
          name="username"
          autoComplete="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="请输入用户名"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">密码</Label>

        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="请输入密码"
          required
        />
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "登录中..." : "登录"}
      </Button>
    </form>
  );
}
