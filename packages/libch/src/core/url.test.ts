import { describe, it, expect } from "vitest";
import { parseBbsUrl } from "./url";

describe("parseBbsUrl", () => {
    // Test cases for thread URLs
    describe("Thread URLs", () => {
        it("should parse a standard https thread URL", () => {
            const url =
                "https://bbs.eddibb.cc/test/read.cgi/livejupiter/1678886400/";
            expect(parseBbsUrl(url)).toEqual({
                host: "bbs.eddibb.cc",
                board: "livejupiter",
                threadId: "1678886400",
            });
        });

        it("should parse a standard http thread URL", () => {
            const url =
                "http://bbs.eddibb.cc/test/read.cgi/livejupiter/1234567890/";
            expect(parseBbsUrl(url)).toEqual({
                host: "bbs.eddibb.cc",
                board: "livejupiter",
                threadId: "1234567890",
            });
        });

        it("should parse a thread URL with a post number", () => {
            const url =
                "http://bbs.eddibb.cc/test/read.cgi/liveedge/1757726099/14";
            expect(parseBbsUrl(url)).toEqual({
                host: "bbs.eddibb.cc",
                board: "liveedge",
                threadId: "1757726099",
            });
        });
    });

    // Test cases for board URLs
    describe("Board URLs", () => {
        it("should parse a board URL with https", () => {
            const url = "https://bbs.eddibb.cc/liveedge/";
            expect(parseBbsUrl(url)).toEqual({
                host: "bbs.eddibb.cc",
                board: "liveedge",
            });
        });

        it("should parse a board URL without protocol", () => {
            const url = "bbs.eddibb.cc/liveedge";
            expect(parseBbsUrl(url)).toEqual({
                host: "bbs.eddibb.cc",
                board: "liveedge",
            });
        });

        it("should parse a board URL with trailing slash", () => {
            const url = "bbs.eddibb.cc/testboard/";
            expect(parseBbsUrl(url)).toEqual({
                host: "bbs.eddibb.cc",
                board: "testboard",
            });
        });

        it("should handle board URLs with special characters that are valid in paths", () => {
            const url = "https://bbs.example.com/newsplus-";
            expect(parseBbsUrl(url)).toEqual({
                host: "bbs.example.com",
                board: "newsplus-",
            });
        });
    });

    // Test cases for invalid or unhandled URLs
    describe("Invalid and Unhandled URLs", () => {
        it("should return null for a non-BBS URL", () => {
            const url = "https://www.google.com";
            expect(parseBbsUrl(url)).toBeNull();
        });

        it("should return null for an empty string", () => {
            const url = "";
            expect(parseBbsUrl(url)).toBeNull();
        });

        it("should return null for a completely invalid string", () => {
            const url = "not a url";
            expect(parseBbsUrl(url)).toBeNull();
        });

        it("should ignore special path segments like bbsmenu", () => {
            const url = "https://bbs.eddibb.cc/bbsmenu/menu.html";
            expect(parseBbsUrl(url)).toBeNull();
        });
    });
});
