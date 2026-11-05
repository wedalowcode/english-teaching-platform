import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListPagination } from "@/components/shared/list-pagination";
import { UserTable } from "@/features/users/components/user-table";
import { userListQuerySchema } from "@/features/users/schemas";
import { getUserList } from "@/features/users/service";

const PAGE_SIZE = 10;

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function UsersPage({ searchParams }: Props) {
  const query = userListQuerySchema.parse(await searchParams);
  const keyword = query.keyword;

  const { items, total, page, totalPages } = await getUserList({
    page: query.page,
    pageSize: PAGE_SIZE,
    keyword,
  });

  return (
    <main className="space-y-4 p-6">
      <h1 className="text-xl font-semibold">用户管理</h1>

      <form className="flex gap-2">
        <Input
          name="keyword"
          defaultValue={keyword}
          placeholder="搜索用户名或手机号"
          className="max-w-xs"
        />
        <Button type="submit">搜索</Button>
      </form>

      <p className="text-sm text-muted-foreground">共 {total} 位用户</p>

      <UserTable users={items} />

      <ListPagination
        page={page}
        totalPages={totalPages}
        basePath="/admin/users"
        params={{ keyword }}
      />
    </main>
  );
}
