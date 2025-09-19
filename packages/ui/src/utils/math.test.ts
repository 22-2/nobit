import { describe, it, expect } from "vitest";

// Example utility functions to test
export function add(a: number, b: number): number {
    return a + b;
}

export function multiply(a: number, b: number): number {
    return a * b;
}

export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

describe("Math utilities", () => {
    describe("add", () => {
        it("should add two positive numbers", () => {
            expect(add(2, 3)).toBe(5);
        });

        it("should add negative numbers", () => {
            expect(add(-2, -3)).toBe(-5);
        });

        it("should handle zero", () => {
            expect(add(0, 5)).toBe(5);
            expect(add(5, 0)).toBe(5);
        });
    });

    describe("multiply", () => {
        it("should multiply two positive numbers", () => {
            expect(multiply(3, 4)).toBe(12);
        });

        it("should handle zero", () => {
            expect(multiply(5, 0)).toBe(0);
            expect(multiply(0, 5)).toBe(0);
        });

        it("should handle negative numbers", () => {
            expect(multiply(-2, 3)).toBe(-6);
            expect(multiply(-2, -3)).toBe(6);
        });
    });

    describe("clamp", () => {
        it("should clamp value within range", () => {
            expect(clamp(5, 0, 10)).toBe(5);
        });

        it("should clamp to minimum", () => {
            expect(clamp(-5, 0, 10)).toBe(0);
        });

        it("should clamp to maximum", () => {
            expect(clamp(15, 0, 10)).toBe(10);
        });

        it("should handle edge cases", () => {
            expect(clamp(0, 0, 10)).toBe(0);
            expect(clamp(10, 0, 10)).toBe(10);
        });
    });
});
