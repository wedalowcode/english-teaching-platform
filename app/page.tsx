import { redirect } from "next/navigation";

import { getCurrentActor } from "@/lib/auth/current-actor";
import { getPortalDestination } from "@/lib/auth/portal-routing";

// 入口分发需要读取会话，不能使用静态缓存
export const instant = false;

/**
 * 根路径不再渲染业务内容，只负责入口分发：
 * 未登录去登录页，已登录按入口权限进入对应门户，无入口权限去 403。
 */
export default async function HomePage() {
  const actor = await getCurrentActor();

  // 未登录或者用户已经被禁用
  if (!actor) {
    redirect("/login");
  }

  const destination = getPortalDestination(actor);

  // 已登录，但没有任何可用入口
  if (!destination) {
    redirect("/forbidden");
  }

  redirect(destination);
}
