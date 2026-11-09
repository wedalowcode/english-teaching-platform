import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * 读取当前登录用户。
 *
 * 1. 没有会话（未登录、Cookie 过期、会话已撤销）返回 null。
 * 2. 会话有效但用户在库中不存在，返回 null。
 * 3. 会话有效但用户已停用，返回 null。
 *
 * 用 cache() 去重：同一次请求内，页面、布局、Service、Server Action
 * 多次调用只会真正读一次会话和一次用户。
 */
export const getCurrentUser = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  const user = await db.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      phone: true,
      status: true,
    },
  });

  if (!user || user.status !== "ACTIVE") {
    return null;
  }

  return user;
});

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
