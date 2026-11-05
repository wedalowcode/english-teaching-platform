import { db } from "@/lib/db";

export default async function Home() {
  const userCount = await db.user.count();

  return (
    <main className="p-10">
      <h1 className="text-2xl font-bold">
        LearnEnglish
      </h1>

      <p className="mt-4">
        英语教学管理平台开发环境
      </p>

      <p className="mt-2">
        当前用户数量：{userCount}
      </p>
    </main>
  );
}