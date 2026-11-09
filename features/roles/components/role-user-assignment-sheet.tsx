"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import {
  getRoleUserCandidatesAction,
  updateRoleUsersAction,
} from "@/features/users/actions";

type Candidate = {
  id: string;
  name: string;
  username: string | null;
  email: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleId: string;
  roleName: string;
};

export function RoleUserAssignmentSheet({
  open,
  onOpenChange,
  roleId,
  roleName,
}: Props) {
  const [keyword, setKeyword] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [users, setUsers] = useState<Candidate[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();

  const fetchCandidates = async (keyword: string, isInitial: boolean) => {
    setLoading(true);

    try {
      const result = await getRoleUserCandidatesAction(roleId, keyword);

      if (result) {
        setUsers(result.users);

        // 仅首次打开时用已分配用户初始化选择，搜索时保留已勾选项
        if (isInitial) {
          setSelectedUserIds(result.assignedUserIds);
        }
      }
    } catch {
      toast.error("加载用户失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  function handleOpenChange(next: boolean) {
    onOpenChange(next);

    if (next) {
      void fetchCandidates("", true);
    } else {
      setKeyword("");
      setSearchKeyword("");
      setUsers([]);
      setSelectedUserIds([]);
    }
  }

  function toggle(id: string, checked: boolean) {
    setSelectedUserIds((current) =>
      checked ? [...current, id] : current.filter((item) => item !== id)
    );
  }

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    fetchCandidates(searchKeyword, false);
  }

  function save() {
    const formData = new FormData();
    selectedUserIds.forEach((id) => formData.append("userIds", id));

    startTransition(async () => {
      try {
        const result = await updateRoleUsersAction(roleId, formData);

        if (result.success) {
          toast.success("用户分配成功");
          onOpenChange(false);
        } else {
          toast.error(result.message ?? "分配失败");
        }
      } catch {
        toast.error("操作失败，请稍后重试");
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>分配用户</SheetTitle>
          <SheetDescription>为角色「{roleName}」选择用户。</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSearch} className="flex gap-2 px-4">
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索姓名、用户名或邮箱"
          />
          <Button type="submit" variant="outline" disabled={loading}>
            {loading ? "加载中..." : "搜索"}
          </Button>
        </form>

        <div className="flex-1 space-y-3 overflow-y-auto px-4">
          {users.map((user) => (
            <label key={user.id} className="flex items-start gap-3">
              <Checkbox
                checked={selectedUserIds.includes(user.id)}
                onCheckedChange={(checked) => toggle(user.id, checked)}
              />
              <span>
                <span className="block font-medium">{user.name}</span>
                <span className="text-xs text-muted-foreground">
                  {user.username ?? "未设置用户名"} · {user.email}
                </span>
              </span>
            </label>
          ))}

          {users.length === 0 && !loading && (
            <p className="text-sm text-muted-foreground">暂无匹配用户</p>
          )}
        </div>

        <div className="border-t p-4">
          <p className="mb-3 text-sm text-muted-foreground">
            已选择 {selectedUserIds.length} 位用户
          </p>
          <Button onClick={save} disabled={pending} className="w-full">
            {pending ? "保存中..." : "保存分配"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
