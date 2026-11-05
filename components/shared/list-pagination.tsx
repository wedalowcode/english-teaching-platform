import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";

type Props = {
  page: number;
  totalPages: number;
  basePath: string;
  params?: Record<string, string | undefined>;
};

export function ListPagination({
  page,
  totalPages,
  basePath,
  params = {},
}: Props) {
  const hrefOf = (target: number) => {
    const search = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value) search.set(key, value);
    }
    search.set("page", String(target));

    return `${basePath}?${search.toString()}`;
  };

  const linkClass = buttonVariants({ variant: "outline", size: "sm" });

  return (
    <nav aria-label="分页" className="flex items-center gap-4">
      {page > 1 ? (
        <Link href={hrefOf(page - 1)} className={linkClass}>
          上一页
        </Link>
      ) : (
        <Button variant="outline" size="sm" disabled>
          上一页
        </Button>
      )}

      <span className="text-sm">
        {page} / {totalPages}
      </span>

      {page < totalPages ? (
        <Link href={hrefOf(page + 1)} className={linkClass}>
          下一页
        </Link>
      ) : (
        <Button variant="outline" size="sm" disabled>
          下一页
        </Button>
      )}
    </nav>
  );
}
