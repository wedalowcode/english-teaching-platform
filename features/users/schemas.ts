import { z } from "zod";

export const userListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  keyword: z.string().trim().max(50).catch(""),
});