"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePagePermission } from "@/lib/auth/authorization";
import type { UserStatus } from "@/app/generated/prisma/client";
import {
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
  userRoleAssignmentSchema,
  toFieldErrors,
  type CreateUserState,
  type UpdateUserState,
  type ResetPasswordState,
} from "./schemas";
import {
  createUser,
  deleteUser,
  resetUserPassword,
  setUserStatus,
  updateUser,
  updateUserRoles,
} from "./service";

export async function createUserAction(
  _prevState: CreateUserState,
  formData: FormData
): Promise<CreateUserState> {
  await requirePagePermission("user.create");

  const values = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    username: String(formData.get("username") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  };

  const parsed = createUserSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!parsed.success) {
    return {
      message: "请检查表单内容",
      fieldErrors: toFieldErrors(parsed.error),
      values,
    };
  }

  try {
    await createUser(parsed.data);
  } catch (error) {
    if (error instanceof Error && error.message === "用户名已存在") {
      return {
        message: error.message,
        fieldErrors: { username: [error.message] },
        values,
      };
    }

    if (error instanceof Error && error.message === "邮箱已被使用") {
      return {
        message: error.message,
        fieldErrors: { email: [error.message] },
        values,
      };
    }

    throw error;
  }

  revalidatePath("/admin/users");
  redirect("/admin/users?created=1");
}

export async function updateUserAction(
  id: string,
  _prevState: UpdateUserState,
  formData: FormData
): Promise<UpdateUserState> {
  await requirePagePermission("user.edit");

  const values = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    username: String(formData.get("username") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  };

  const parsed = updateUserSchema.safeParse(values);

  if (!parsed.success) {
    return {
      message: "请检查表单内容",
      fieldErrors: toFieldErrors(parsed.error),
      values,
    };
  }

  const result = await updateUser(id, parsed.data);

  if (!result.success) {
    return {
      message: result.message,
      fieldErrors:
        result.code === "USERNAME_TAKEN"
          ? { username: [result.message] }
          : result.code === "EMAIL_TAKEN"
            ? { email: [result.message] }
            : undefined,
      values,
    };
  }

  revalidatePath("/admin/users");
  redirect("/admin/users?updated=1");
}

export async function resetUserPasswordAction(
  id: string,
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  await requirePagePermission("user.resetPassword");

  const values = {
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  };

  const parsed = resetPasswordSchema.safeParse(values);

  if (!parsed.success) {
    return {
      message: "请检查密码输入",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const result = await resetUserPassword(id, parsed.data.password);

  if (!result.success) {
    return {
      message: result.message,
    };
  }

  return {
    success: true,
    message: "密码已重置",
  };
}

export type UserActionResult = {
  success: boolean;
  message?: string;
};

export async function setUserStatusAction(
  id: string,
  status: UserStatus
): Promise<UserActionResult> {
  await requirePagePermission("user.disable");

  if (status !== "ACTIVE" && status !== "DISABLED") {
    return {
      success: false,
      message: "无效的用户状态",
    };
  }

  const result = await setUserStatus(id, status);

  revalidatePath("/admin/users");

  return result.success
    ? { success: true }
    : { success: false, message: result.message };
}

export async function deleteUserAction(
  id: string
): Promise<UserActionResult> {
  await requirePagePermission("user.delete");

  const result = await deleteUser(id);

  revalidatePath("/admin/users");

  return result.success
    ? { success: true }
    : { success: false, message: result.message };
}

export async function updateUserRolesAction(
  userId: string,
  formData: FormData
) {
  await requirePagePermission("user.assignRole");

  const parsed = userRoleAssignmentSchema.safeParse({
    roleIds: formData.getAll("roleIds").map(String),
  });

  if (!parsed.success) {
    return { success: false as const, message: "角色数据格式不正确" };
  }

  const result = await updateUserRoles(userId, parsed.data.roleIds);

  revalidatePath("/admin/users");
  revalidatePath("/admin/roles");

  return result;
}
