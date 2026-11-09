import "server-only";

import { db } from "@/lib/db";
import type { Prisma } from "@/app/generated/prisma/client";

type RoleListParams = {
  page: number;
  pageSize: number;
  keyword: string;
};

export async function getRoleList(params: RoleListParams) {
  const { pageSize, keyword } = params;

  const where: Prisma.RoleWhereInput = keyword
    ? {
        OR: [
          {
            name: {
              contains: keyword,
              mode: "insensitive",
            },
          },
          {
            code: {
              contains: keyword,
              mode: "insensitive",
            },
          },
        ],
      }
    : {};

  const total = await db.role.count({ where });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const page = Math.min(Math.max(1, params.page), totalPages);

  const items = await db.role.findMany({
    where,

    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      isSystem: true,
      createdAt: true,

      _count: {
        select: {
          userRoles: true,
        },
      },
    },

    orderBy: [
      { isSystem: "desc" },
      { createdAt: "asc" },
      { id: "asc" },
    ],

    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
  };
}
