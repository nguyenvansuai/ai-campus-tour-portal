import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/safe-redirect";

describe("safeNextPath", () => {
  it.each([
    ["/bat-dau?ma=ABCD2345", "/bat-dau?ma=ABCD2345"],
    ["https://evil.example", "/hoc"],
    ["//evil.example", "/hoc"],
    ["/\\evil.example", "/hoc"],
    [undefined, "/hoc"],
  ])("%s → %s", (input, expected) => {
    expect(safeNextPath(input)).toBe(expected);
  });
});
