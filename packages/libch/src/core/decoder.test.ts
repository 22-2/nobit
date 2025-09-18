import { describe, it, expect } from "vitest";
import { DefaultDecoder } from "./decoder";

describe("DefaultDecoder", () => {
  it("should decode a Shift-JIS encoded buffer correctly", () => {
    const decoder = new DefaultDecoder();

    // "こんにちは、世界！" in Shift-JIS
    const sjisBuffer = new Uint8Array([
      0x82, 0xb1, 0x82, 0xf1, 0x82, 0xc9, 0x82, 0xbf, 0x82, 0xcd, 0x81, 0x41,
      0x90, 0xa2, 0x8a, 0x45, 0x81, 0x49,
    ]).buffer;

    const expectedString = "こんにちは、世界！";

    expect(decoder.decode(sjisBuffer)).toBe(expectedString);
  });
});
