import "server-only";

type ParentResourceFinder = (
  id: string,
  where: object
) => Promise<boolean>;

/**
 * 创建业务数据时的父资源查询器。
 *
 * 学生、课程、排课、线索等业务模型尚未落地，先不注册任何查询器。
 * 某个业务模型实现后，再按实际 Prisma 模型补充对应 Finder：
 *
 * - 查询必须同时使用主键条件和数据范围条件（findFirst）；
 * - 记录不存在或无权访问时返回 false，不区分两种原因。
 */
export const PARENT_RESOURCE_FINDERS: Record<
  string,
  ParentResourceFinder
> = {};
