import { z } from "zod";

export const userListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  keyword: z.string().trim().max(50).catch(""),
});

export const createUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "用户名至少 3 位")
    .max(30, "用户名不能超过 30 位")
    .regex(/^[a-zA-Z0-9_]+$/, "只能使用字母、数字和下划线")
    .transform((v) => v.toLowerCase()),

  phone: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .refine(
      (v) => v === null || /^1[3-9]\d{9}$/.test(v),
      "手机号格式不正确"
    ),

  password: z
    .string()
    .min(8, "密码至少 8 位")
    .max(128, "密码不能超过 128 位"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export type CreateUserState = {
  message?: string;
  fieldErrors?: Record<string, string[]>;
  values?: {
    username: string;
    phone: string;
  };
};