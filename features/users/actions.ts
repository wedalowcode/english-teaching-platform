"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserAdmin } from "@/lib/auth-guard";
import {
  createUserSchema,
  updateUserSchema,
  toFieldErrors,
  type CreateUserState,
  type UpdateUserState,
} from "./schemas";
import { createUser, updateUser } from "./service";

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
