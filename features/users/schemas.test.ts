import { describe, expect, it } from "vitest";
import { createUserSchema, updateUserSchema } from "./schemas";

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

describe("用户资料校验", () => {
  it("用户名过短时校验失败", () => {
    const result = updateUserSchema.safeParse({
      username: "ab",
      phone: "",
    });

    expect(result.success).toBe(false);
  });

  it("用户名包含非法字符时校验失败", () => {
    const result = updateUserSchema.safeParse({
      username: "alice@123",
      phone: "",
    });

    expect(result.success).toBe(false);
  });

  it("用户名应统一转换为小写", () => {
    const result = updateUserSchema.safeParse({
      username: "Alice_01",
      phone: "",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.username).toBe("alice_01");
    }
  });

  it("手机号为空时应转换为 null", () => {
    const result = updateUserSchema.safeParse({
      username: "alice",
      phone: "",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.phone).toBeNull();
    }
  });

  it("新增用户仍然必须提供密码", () => {
    const result = createUserSchema.safeParse({
      username: "alice",
      phone: "",
    });

    expect(result.success).toBe(false);
  });
});
