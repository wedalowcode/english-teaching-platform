// Argon2id 参数。放在不带 server-only 的模块里，方便 seed 脚本复用。
// 调整参数时，已有用户的密码哈希仍可验证，但新哈希会使用新参数。
export const argon2Params = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};
