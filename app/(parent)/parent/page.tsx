export default function ParentHomePage() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">家长中心</h1>
        <p className="text-sm text-muted-foreground">
          孩子的学习档案和课程报告将在后续模块中接入。
        </p>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm font-medium">暂无待办事项</p>
        <p className="mt-1 text-xs text-muted-foreground">
          课程安排、作业反馈和阶段报告上线后会显示在这里。
        </p>
      </div>
    </div>
  );
}
