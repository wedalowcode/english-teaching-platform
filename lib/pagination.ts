import { z } from "zod";

/** 每页条数可选值，分页下拉框与列表查询共用同一份配置。 */
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 200] as const;

export const DEFAULT_PAGE_SIZE = 10;

/** 非法或缺失的 pageSize 统一回落为默认值，避免手改 URL 报错。 */
export const pageSizeSchema = z.coerce
  .number()
  .int()
  .refine((value) =>
    (PAGE_SIZE_OPTIONS as readonly number[]).includes(value)
  )
  .catch(DEFAULT_PAGE_SIZE);
