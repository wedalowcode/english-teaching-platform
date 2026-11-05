// features/users/constants.ts
import type { UserStatus } from "@/app/generated/prisma/client";

export const USER_STATUS_LABEL: Record<UserStatus, string> = {
  ACTIVE: "启用",
  DISABLED: "停用",
};