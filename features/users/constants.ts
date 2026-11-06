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

const USER_DATE_FORMATTER = new Intl.DateTimeFormat("zh-CN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Shanghai",
});

export function formatUserDate(value: Date) {
  return USER_DATE_FORMATTER.format(value);
}
