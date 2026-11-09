import { z } from "zod";

export const roleListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  keyword: z.string().trim().max(50).catch(""),
});

export const roleUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  keyword: z.string().trim().max(50).catch(""),
});

const roleCodeField = z
  .string()
  .trim()
  .min(2, "角色编码至少 2 位")
  .max(30, "角色编码不能超过 30 位")
  .regex(
    /^[A-Z][A-Z0-9_]*$/,
    "角色编码必须以大写字母开头，只能包含大写字母、数字和下划线"
  );

const roleNameField = z
  .string()
  .trim()
  .min(1, "请输入角色名称")
  .max(50, "角色名称不能超过 50 位");

const roleDescriptionField = z
  .string()
  .trim()
  .max(200, "角色说明不能超过 200 位")
  .transform((value) => value || null);

export const createRoleSchema = z.object({
  code: roleCodeField,
  name: roleNameField,
  description: roleDescriptionField,
});

export const updateRoleSchema = z.object({
  name: roleNameField,
  description: roleDescriptionField,
});

export type RoleListQuery = z.infer<typeof roleListQuerySchema>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

export type RoleFormState = {
  message?: string;
  fieldErrors?: {
    code?: string[];
    name?: string[];
    description?: string[];
  };
  values?: {
    code?: string;
    name?: string;
    description?: string;
  };
};
