import { describe, it, expect, vi } from "vitest";
import { DefaultBBSProvider } from "./DefaultBBSProvider";
import type { HttpFetcher } from "../core/fetcher";
import type { PostData } from "../core/types";

// Mock HttpFetcher
const createMockFetcher = (postResult: Promise<ArrayBuffer>): HttpFetcher => ({
  fetch: vi.fn(),
  post: vi.fn().mockReturnValue(postResult),
});

describe("DefaultBBSProvider", () => {
  describe("post", () => {
    it("should include Referer and custom headers in post requests", async () => {
      // Arrange
      const mockResponse = new TextEncoder().encode("書きこみました").buffer;
      const mockFetcher = createMockFetcher(Promise.resolve(mockResponse));
      const provider = new DefaultBBSProvider(mockFetcher);
      const threadUrl = "https://egg.5ch.net/test/read.cgi/river/1234567890/";
      const postData: PostData = {
        name: "test-user",
        mail: "test@example.com",
        content: "test message",
      };
      const customHeaders = { "User-Agent": "Test-UA" };
      const expectedPostUrl = "https://egg.5ch.net/test/bbs.cgi";

      // Act
      await provider.post(threadUrl, postData, customHeaders);

      // Assert
      expect(mockFetcher.post).toHaveBeenCalledTimes(1);
      const postCallArgs = (mockFetcher.post as ReturnType<typeof vi.fn>).mock
        .calls[0];
      const actualUrl = postCallArgs[0];
      const actualHeaders = postCallArgs[2]; // url, body, headers

      expect(actualUrl).toBe(expectedPostUrl);
      expect(actualHeaders).toBeDefined();
      expect(actualHeaders).toEqual({
        Referer: threadUrl,
        "User-Agent": "Test-UA",
      });
    });

    it("should construct the correct request body for an initial post", async () => {
      // Arrange
      const mockResponse = new TextEncoder().encode("書きこみました").buffer;
      const mockFetcher = createMockFetcher(Promise.resolve(mockResponse));
      const provider = new DefaultBBSProvider(mockFetcher);
      const threadUrl = "https://egg.5ch.net/test/read.cgi/river/1234567890/";
      const postData: PostData = {
        name: "test-user",
        mail: "test@example.com",
        content: "test message",
      };

      // Act
      await provider.post(threadUrl, postData);

      // Assert
      expect(mockFetcher.post).toHaveBeenCalledTimes(1);
      const postCallArgs = (mockFetcher.post as ReturnType<typeof vi.fn>).mock
        .calls[0];
      const body = postCallArgs[1] as URLSearchParams; // url, body, headers

      expect(body.get("FROM")).toBe(postData.name);
      expect(body.get("mail")).toBe(postData.mail);
      expect(body.get("MESSAGE")).toBe(postData.content);
      expect(body.get("bbs")).toBe("river");
      expect(body.get("key")).toBe("1234567890");
      expect(body.get("submit")).toBe("書き込む");
      expect(body.has("time")).toBe(true);
      expect(body.get("oekaki_thread1")).toBe("");
      expect(body.get("feature")).toBe("");
    });
  });
});
