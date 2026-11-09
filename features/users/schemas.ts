import { z } from "zod";

export const userListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  keyword: z.string().trim().max(50).catch(""),
});

const nameField = z
  .string()
  .trim()
  .min(1, "请输入姓名")
  .max(50, "姓名不能超过 50 位");

const emailField = z
  .email("邮箱格式不正确")
  .max(100, "邮箱不能超过 100 位")
  .transform((value) => value.toLowerCase());

const usernameField = z
  .string()
  .trim()
  .min(3, "用户名至少 3 位")
  .max(30, "用户名不能超过 30 位")
  .regex(/^[a-zA-Z0-9_]+$/, "只能使用字母、数字和下划线")
  .transform((value) => value.toLowerCase());

const phoneField = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .refine(
    (value) => value === null || /^1[3-9]\d{9}$/.test(value),
    "手机号格式不正确"
  );

export const createUserSchema = z.object({
  name: nameField,
  email: emailField,
  username: usernameField,
  phone: phoneField,
  password: z
    .string()
    .min(8, "密码至少 8 位")
    .max(128, "密码不能超过 128 位"),
});

export const updateUserSchema = z.object({
  name: nameField,
  email: emailField,
  username: usernameField,
  phone: phoneField,
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "密码至少 8 位")
      .max(128, "密码不能超过 128 位"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "两次输入的密码不一致",
  });

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export type CreateUserState = {
  message?: string;
  fieldErrors?: Record<string, string[]>;
  values?: {
    name: string;
    email: string;
    username: string;
    phone: string;
  };
};

export type UpdateUserState = {
  message?: string;
  fieldErrors?: {
    name?: string[];
    email?: string[];
    username?: string[];
    phone?: string[];
  };
  values?: {
    name: string;
    email: string;
    username: string;
    phone: string;
  };
};

export type ResetPasswordState = {
  success?: boolean;
  message?: string;
  fieldErrors?: {
    password?: string[];
    confirmPassword?: string[];
  };
};

export function toFieldErrors(
  error: z.ZodError
): Record<string, string[]> {
  const flattened = z.flattenError(error).fieldErrors;

  const result: Record<string, string[]> = {};

  for (const [key, messages] of Object.entries(flattened)) {
    if (Array.isArray(messages) && messages.length > 0) {
      result[key] = messages;
    }
  }

  return result;
}
