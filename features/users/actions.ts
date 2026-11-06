"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserAdmin } from "@/lib/auth-guard";
import { createUserSchema, type CreateUserState } from "./schemas";
import { createUser } from "./service";

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
      fieldErrors: parsed.error.flatten().fieldErrors,
      values,
    };
  }

  try {
    await createUser(parsed.data);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "用户名已存在"
    ) {
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