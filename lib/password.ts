import "server-only";
import * as argon2 from "argon2";

import { argon2Params } from "@/lib/password-config";

export async function hashPassword(password: string) {
  return argon2.hash(password, {
    type: argon2.argon2id,
    ...argon2Params,
  });
}

export async function verifyPassword(
  password: string,
  passwordHash: string
) {
  return argon2.verify(passwordHash, password);
}
