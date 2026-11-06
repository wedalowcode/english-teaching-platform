import { Bell, ChevronDown, Search } from "lucide-react";

export function AdminTopbar() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b border-[#D9E2F0] bg-white px-6">
      {/* 左侧机构信息 */}
      <div className="flex items-center gap-3">
        <div className="text-sm font-semibold text-[#172033]">
          启航英语
        </div>

        <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
          城东校区
        </span>

        <span className="hidden text-xs text-slate-400 md:inline">
          管理后台
        </span>
      </div>

      {/* 右侧操作 */}
      <div className="ml-auto flex items-center gap-5">
        <button
          type="button"
          className="hidden items-center gap-2 rounded-lg border border-[#D9E2F0] bg-[#F8FAFD] px-3 py-2 text-xs text-slate-500 transition hover:border-blue-300 hover:text-blue-700 sm:flex"
        >
          <Search className="size-4" />
          <span>搜索功能</span>
          <span className="rounded bg-white px-1.5 py-0.5 text-[10px] text-slate-400">
            Ctrl K
          </span>
        </button>

        <button
          type="button"
          aria-label="消息通知"
          className="relative flex size-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-700"
        >
          <Bell className="size-[18px]" />
          <span className="absolute right-2 top-2 size-2 rounded-full border-2 border-white bg-red-500" />
        </button>

        <div className="h-7 w-px bg-[#D9E2F0]" />

        {/* 当前用户 */}
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-slate-50"
        >
          <div className="flex size-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
            管
          </div>

          <div className="hidden text-left sm:block">
            <div className="text-xs font-semibold text-[#172033]">
              系统管理员
            </div>
            <div className="text-[10px] text-slate-500">
              超级管理员
            </div>
          </div>

          <ChevronDown className="size-4 text-slate-400" />
        </button>
      </div>
    </header>
  );
}
