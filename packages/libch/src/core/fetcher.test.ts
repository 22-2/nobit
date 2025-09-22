import { describe, it, expect, vi, afterEach } from "vitest";
import { DefaultFetcher, HttpError } from "./fetcher";

// Mock the global fetch function
const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

describe("DefaultFetcher", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("fetch", () => {
        it("should return an ArrayBuffer on successful fetch", async () => {
            const fetcher = new DefaultFetcher();
            const mockBuffer = new ArrayBuffer(8);
            const mockResponse = {
                ok: true,
                arrayBuffer: () => Promise.resolve(mockBuffer),
            };
            fetchMock.mockResolvedValue(mockResponse);

            const result = await fetcher.fetch("http://example.com");
            expect(result).toBe(mockBuffer);
            expect(fetchMock).toHaveBeenCalledWith("http://example.com");
        });

        it("should throw HttpError on failed fetch", async () => {
            const fetcher = new DefaultFetcher();
            const mockResponse = {
                ok: false,
                status: 404,
            };
            fetchMock.mockResolvedValue(mockResponse);

            try {
                await fetcher.fetch("http://example.com/notfound");
            } catch (e) {
                expect(e).toBeInstanceOf(HttpError);
                if (e instanceof HttpError) {
                    expect(e.status).toBe(404);
                    expect(e.message).toBe(
                        "HTTP error! status: 404 for URL: http://example.com/notfound"
                    );
                }
            }
        });
    });

    describe("post", () => {
        it("should return an ArrayBuffer on successful post", async () => {
            const fetcher = new DefaultFetcher();
            const mockBuffer = new ArrayBuffer(8);
            const mockResponse = {
                ok: true,
                arrayBuffer: () => Promise.resolve(mockBuffer),
            };
            fetchMock.mockResolvedValue(mockResponse);
            const body = new URLSearchParams({ key: "value" });

            const result = await fetcher.post(
                "http://example.com/submit",
                body
            );
            expect(result).toBe(mockBuffer);
            expect(fetchMock).toHaveBeenCalledWith(
                "http://example.com/submit",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: "key=value",
                }
            );
        });

        it("should throw HttpError on failed post", async () => {
            const fetcher = new DefaultFetcher();
            const mockResponse = {
                ok: false,
                status: 500,
            };
            fetchMock.mockResolvedValue(mockResponse);
            const body = new URLSearchParams({ key: "value" });

            try {
                await fetcher.post("http://example.com/submit", body);
            } catch (e) {
                expect(e).toBeInstanceOf(HttpError);
                if (e instanceof HttpError) {
                    expect(e.status).toBe(500);
                    expect(e.message).toBe(
                        "HTTP error! status: 500 for URL: http://example.com/submit"
                    );
                }
            }
        });
    });
});
