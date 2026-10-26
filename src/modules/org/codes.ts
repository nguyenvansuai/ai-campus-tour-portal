import { randomInt } from "node:crypto";

// Bỏ 0/O, 1/I/L để SV đọc mã trên màn chiếu không nhầm.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateActivationCode(length = 8) {
  let code = "";
  for (let i = 0; i < length; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return code;
}

export function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}
