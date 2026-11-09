// features/users/constants.ts
import type { UserStatus } from "@/app/generated/prisma/client";

export const USER_STATUS_LABEL: Record<UserStatus, string> = {
  ACTIVE: "启用",
  DISABLED: "停用",
};

export const USER_STATUS_BADGE_VARIANT: Record<
  UserStatus,
  "default" | "secondary"
> = {
  ACTIVE: "default",
  DISABLED: "secondary",
};

// 用户列表和角色列表共用同一套日期格式与上海时区
export { formatDateTime as formatUserDate } from "@/lib/date";