import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { hashPassword, verifyPassword } from "./password";

describe("password", () => {
  it("每次哈希结果不同，且不包含明文", async () => {
    const password = "12345678";
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    expect(hash1).not.toBe(hash2);
    expect(hash1).toMatch(/^\$argon2id\$/);
    expect(hash1).not.toContain(password);
  });

  it("能够验证正确密码并拒绝错误密码", async () => {
    const hash = await hashPassword("12345678");

    expect(await verifyPassword("12345678", hash)).toBe(true);
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });
});
