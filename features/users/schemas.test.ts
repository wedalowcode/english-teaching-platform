import { describe, expect, it } from "vitest";
import { createUserSchema } from "./schemas";

const valid = {
  username: "Alice_01",
  phone: "13800138000",
  password: "12345678",
};

describe("createUserSchema", () => {
  it("用户名统一转换为小写", () => {
    expect(createUserSchema.parse(valid).username).toBe("alice_01");
  });

  it("拒绝过短用户名", () => {
    expect(
      createUserSchema.safeParse({ ...valid, username: "ab" }).success
    ).toBe(false);
  });

  it("拒绝非法用户名字符", () => {
    expect(
      createUserSchema.safeParse({ ...valid, username: "alice@01" }).success
    ).toBe(false);
  });

  it("拒绝过短密码", () => {
    expect(
      createUserSchema.safeParse({ ...valid, password: "123" }).success
    ).toBe(false);
  });

  it("拒绝错误手机号", () => {
    expect(
      createUserSchema.safeParse({ ...valid, phone: "123" }).success
    ).toBe(false);
  });

  it("空手机号转换为 null", () => {
    expect(createUserSchema.parse({ ...valid, phone: "" }).phone).toBeNull();
  });
});
