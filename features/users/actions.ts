"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserAdmin } from "@/lib/auth-guard";
import type { UserStatus } from "@/app/generated/prisma/client";
import {
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
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
} from "./service";

export async function createUserAction(
  _prevState: CreateUserState,
  formData: FormData
): Promise<CreateUserState> {
  await requireUserAdmin();

  const values = {
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
  await requireUserAdmin();

  const values = {
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
  await requireUserAdmin();

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

  revalidatePath("/admin/users");
  redirect("/admin/users?passwordReset=1");
}

export async function setUserStatusAction(
  id: string,
  status: UserStatus
) {
  await requireUserAdmin();

  if (status !== "ACTIVE" && status !== "DISABLED") {
    throw new Error("无效的用户状态");
  }

  const result = await setUserStatus(id, status);

  if (!result.success) {
    redirect("/admin/users?error=user-not-found");
  }

  revalidatePath("/admin/users");

  redirect("/admin/users?statusChanged=1");
}

export async function deleteUserAction(id: string) {
  await requireUserAdmin();

  const result = await deleteUser(id);

  if (!result.success) {
    redirect("/admin/users?error=user-not-found");
  }

  revalidatePath("/admin/users");

  redirect("/admin/users?deleted=1");
}
