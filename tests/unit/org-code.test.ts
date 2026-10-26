import { describe, expect, it } from "vitest";
import { generateActivationCode, normalizeName } from "@/modules/org/codes";

describe("generateActivationCode", () => {
  it("8 ký tự, không có ký tự dễ nhầm (0, O, 1, I, L)", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateActivationCode();
      expect(code).toMatch(/^[A-HJ-KM-NP-Z2-9]{8}$/);
    }
  });
});

describe("normalizeName", () => {
  it("bỏ khoảng trắng thừa", () => {
    expect(normalizeName("  Trường   ĐH  Công Thương ")).toBe("Trường ĐH Công Thương");
  });
});
