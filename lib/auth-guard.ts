import "server-only";

export async function requireUserAdmin() {
  if (process.env.NODE_ENV !== "development") {
    throw new Error("尚未接入认证，禁止在非开发环境执行此操作");
  }
}