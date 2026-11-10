"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requirePagePermission } from "@/lib/auth/authorization";

import {
  createRoleSchema,
  updateRoleSchema,
  type RoleFormState,
} from "./schemas";

import {
  addUserToRole,
  createRole,
  removeUserFromRole,
  setRoleStatus,
  updateRole,
} from "./service";

export type RoleActionResult = {
  success: boolean;
  message?: string;
};

export async function createRoleAction(
  _prevState: RoleFormState,
  formData: FormData
): Promise<RoleFormState> {
  await requirePagePermission("role.create");

  const values = {
    code: String(formData.get("code") ?? ""),
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
  };

  const parsed = createRoleSchema.safeParse(values);

  if (!parsed.success) {
    return {
      message: "请检查表单内容",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values,
    };
  }

  const result = await createRole(parsed.data);

  if (!result.success) {
    return {
      message: result.message,
      fieldErrors:
        result.code === "CODE_TAKEN" ? { code: [result.message] } : undefined,
      values,
    };
  }

  revalidatePath("/admin/roles");
  redirect("/admin/roles?created=1");
}

export async function updateRoleAction(
  id: string,
  _prevState: RoleFormState,
  formData: FormData
): Promise<RoleFormState> {
  await requirePagePermission("role.edit");

  const values = {
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
  };

  const parsed = updateRoleSchema.safeParse(values);

  if (!parsed.success) {
    return {
      message: "请检查表单内容",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values,
    };
  }

  const result = await updateRole(id, parsed.data);

  if (!result.success) {
    return {
      message: result.message,
      values,
    };
  }

  revalidatePath("/admin/roles");
  redirect("/admin/roles?updated=1");
}

export async function setRoleStatusAction(
  id: string,
  isActive: boolean
): Promise<RoleActionResult> {
  await requirePagePermission("role.disable");

  if (typeof isActive !== "boolean") {
    return {
      success: false,
      message: "无效的角色状态",
    };
  }

  const result = await setRoleStatus(id, isActive);

  revalidatePath("/admin/roles");

  return result.success
    ? { success: true }
    : { success: false, message: result.message };
}

export async function addUserToRoleAction(
  roleId: string,
  userId: string
): Promise<RoleActionResult> {
  await requirePagePermission("role.assignUser");

  if (!roleId || !userId) {
    return {
      success: false,
      message: "参数不正确",
    };
  }

  const result = await addUserToRole(roleId, userId);

  revalidatePath(`/admin/roles/${roleId}/users`);
  revalidatePath("/admin/roles");
  revalidatePath("/admin/users");

  return result;
}

export async function removeUserFromRoleAction(
  roleId: string,
  userId: string
): Promise<RoleActionResult> {
  await requirePagePermission("role.assignUser");

  if (!roleId || !userId) {
    return {
      success: false,
      message: "参数不正确",
    };
  }

  const result = await removeUserFromRole(roleId, userId);

  revalidatePath(`/admin/roles/${roleId}/users`);
  revalidatePath("/admin/roles");
  revalidatePath("/admin/users");

  return result;
}
