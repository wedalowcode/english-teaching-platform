import "server-only";

import { db } from "@/lib/db";
import type { Prisma } from "@/app/generated/prisma/client";

type UserListParams = {
  page: number;
  pageSize: number;
  keyword: string;
};

export async function getUserList(params: UserListParams) {
  const { pageSize, keyword } = params;

  const where: Prisma.UserWhereInput = keyword
    ? {
        OR: [
          { username: { contains: keyword, mode: "insensitive" } },
          { phone: { contains: keyword } },
        ],
      }
    : {};

  const total = await db.user.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, params.page), totalPages);

  const items = await db.user.findMany({
    where,
    select: {
      id: true,
      username: true,
      phone: true,
      status: true,
      createdAt: true,
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { items, total, page, pageSize, totalPages };
}