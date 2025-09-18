import { describe, it, expect, vi } from "vitest";
import { normalizeDateStr, invariant } from "./utils";

describe("normalizeDateStr", () => {
  it("should remove leading/trailing whitespace", () => {
    expect(normalizeDateStr("  2024/01/01  ")).toBe("2024/01/01");
  });

  it("should remove day of the week part", () => {
    expect(normalizeDateStr("2024/01/01(月)")).toBe("2024/01/01 ");
  });

  it("should handle both trims and day of week", () => {
    expect(normalizeDateStr("  2024/01/01(月)   ")).toBe("2024/01/01 ");
  });
});

describe("invariant", () => {
  it("should not throw an error when condition is true", () => {
    expect(() => invariant(true, "This should not throw")).not.toThrow();
  });

  it("should throw an error when condition is false", () => {
    expect(() => invariant(false, "This should throw")).toThrow(
      "This should throw",
    );
  });

  it("should call onError when condition is false", () => {
    const onError = vi.fn();
    expect(() => invariant(false, "message", onError)).toThrow();
    expect(onError).toHaveBeenCalled();
  });

  it("should not call onError when condition is true", () => {
    const onError = vi.fn();
    invariant(true, "message", onError);
    expect(onError).not.toHaveBeenCalled();
  });
});
