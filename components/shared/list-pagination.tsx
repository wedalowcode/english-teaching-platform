"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button, buttonVariants } from "@/components/ui/button";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/lib/pagination";

type Props = {
  page: number;
  totalPages: number;
  basePath: string;
  pageSize: number;
  params?: Record<string, string | undefined>;
};

export function ListPagination({
  page,
  totalPages,
  basePath,
  pageSize,
  params = {},
}: Props) {
  const router = useRouter();

  const lastPage = Math.max(1, totalPages);

  // 默认值不写进 URL，避免地址栏出现无意义的默认参数
  function buildHref(target: number, size: number) {
    const search = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value) search.set(key, value);
    }

    if (target > 1) search.set("page", String(target));

    if (size !== DEFAULT_PAGE_SIZE) search.set("pageSize", String(size));

    const query = search.toString();

    return query ? `${basePath}?${query}` : basePath;
  }

  function handlePageSizeChange(event: React.ChangeEvent<HTMLSelectElement>) {
    // 改变每页条数后页码归零，否则可能落到超出范围的空页
    router.push(buildHref(1, Number(event.target.value)));
  }

  function jumpToPage(raw: string, input: HTMLInputElement) {
    const target = Number(raw);

    // 非法或越界的输入还原为当前页码，不做跳转
    if (!Number.isInteger(target) || target < 1 || target > lastPage) {
      input.value = String(page);
      return;
    }

    if (target !== page) router.push(buildHref(target, pageSize));
  }

  const linkClass = buttonVariants({ variant: "outline", size: "sm" });

  const renderStep = (
    target: number,
    label: string,
    disabled: boolean
  ) =>
    disabled ? (
      <Button variant="outline" size="sm" disabled>
        {label}
      </Button>
    ) : (
      <Link href={buildHref(target, pageSize)} className={linkClass}>
        {label}
      </Link>
    );

  return (
    <nav
      aria-label="分页"
      className="flex shrink-0 flex-wrap items-center gap-2 text-sm"
    >
      <label className="mr-auto flex items-center gap-2 text-muted-foreground">
        每页
        <select
          value={pageSize}
          onChange={handlePageSizeChange}
          aria-label="每页显示条数"
          className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        条
      </label>

      {renderStep(1, "首页", page <= 1)}
      {renderStep(page - 1, "上一页", page <= 1)}

      <span className="flex items-center gap-1 px-1 text-muted-foreground">
        第
        <input
          // 非受控输入框，页码变化时靠 key 重新挂载同步显示
          key={page}
          defaultValue={page}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              jumpToPage(event.currentTarget.value, event.currentTarget);
            }
          }}
          onBlur={(event) =>
            jumpToPage(event.target.value, event.target)
          }
          inputMode="numeric"
          aria-label="跳转到指定页码"
          className="h-8 w-12 rounded-lg border border-input bg-transparent text-center text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        / {lastPage} 页
      </span>

      {renderStep(page + 1, "下一页", page >= lastPage)}
      {renderStep(lastPage, "尾页", page >= lastPage)}
    </nav>
  );
}
