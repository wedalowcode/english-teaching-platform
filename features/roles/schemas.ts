import { z } from "zod";

export const roleListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  keyword: z.string().trim().max(50).catch(""),
});

export type RoleListParams = z.infer<typeof roleListQuerySchema>;
