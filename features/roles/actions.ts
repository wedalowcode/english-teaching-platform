"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { DataScope } from "@/app/generated/prisma/client";
import { requirePagePermission } from "@/lib/auth/authorization";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import type { PermissionCode } from "@/lib/auth/permissions";

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

const permissionItemSchema = z.object({
  code: z.string(),
  scope: z.enum(["ALL", "OWN", "ASSIGNED"]),
});

const savePermissionsSchema = z.array(permissionItemSchema);

/**
 * 保存角色权限配置。
 *
 * - 只允许分配 BUSINESS 且 grantable 的权限，SYSTEM 权限直接拒绝；
 * - 不支持数据范围的权限只能保存为 ALL；
 * - 事务内先删后写，删除范围限定在当前可分配权限编码内。
 */
export async function saveRolePermissionsAction(
  roleId: string,
  values: unknown
): Promise<RoleActionResult> {
  await requirePagePermission("role.assignPermissions");

  const parsed = savePermissionsSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      message: "权限配置参数不正确",
    };
  }

  const allowedCodes = Object.entries(PERMISSIONS)
    .filter(([, item]) => item.domain === "BUSINESS" && item.grantable)
    .map(([code]) => code);

  const items = parsed.data;

  if (
    new Set(items.map((item) => item.code)).size !== items.length ||
    items.some((item) => !allowedCodes.includes(item.code))
  ) {
    return {
      success: false,
      message: "包含重复或不允许分配的权限",
    };
  }

  for (const item of items) {
    const permission = PERMISSIONS[item.code as PermissionCode];

    if (!permission.scopeable && item.scope !== "ALL") {
      return {
        success: false,
        message: `${permission.name}不支持配置数据范围`,
      };
    }
  }

  const role = await db.role.findUnique({
    where: { id: roleId },
    select: { id: true },
  });

  if (!role) {
    return {
      success: false,
      message: "角色不存在",
    };
  }

  await db.$transaction(async (tx) => {
    await tx.rolePermission.deleteMany({
      where: {
        roleId,
        permissionCode: { in: allowedCodes },
      },
    });

    if (items.length > 0) {
      await tx.rolePermission.createMany({
        data: items.map((item) => ({
          roleId,
          permissionCode: item.code,
          scope: item.scope as DataScope,
        })),
      });
    }
  });

  revalidatePath("/admin/roles");
  revalidatePath(`/admin/roles/${roleId}/permissions`);

  return { success: true };
}
