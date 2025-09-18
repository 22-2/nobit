import { describe, it, expect } from "vitest";
import { DefaultParser } from "./parser";

describe("DefaultParser", () => {
  const parser = new DefaultParser();

  describe("parseSubject", () => {
    it("should parse subject.txt correctly", () => {
      const subjectTxt = `1757496030.dat<>Thread 1 (183)
1757495016.dat<>Thread &amp; 2 (505)
`;
      const expected = [
        { id: "1757496030", title: "Thread 1", resCount: 183 },
        { id: "1757495016", title: "Thread & 2", resCount: 505 },
      ];
      expect(parser.parseSubject(subjectTxt)).toEqual(expected);
    });

    it("should return an empty array for empty input", () => {
      expect(parser.parseSubject("")).toEqual([]);
      expect(parser.parseSubject("  ")).toEqual([]);
    });
  });

  describe("parseThread", () => {
    it("should parse a .dat file correctly", () => {
      const dat = `名無し<>mail<>2025/09/10(水) 11:05:34.06 ID:AbcDef1<>First post<br>with link &gt;&gt;2<>Thread Title
名無し<>sage<>2025/09/10(水) 11:05:45.26 ID:XyZ234<>Second post<>
`;
      const thread = parser.parseThread(
        dat,
        "1757469934",
        "http://example.com"
      );

      expect(thread).toBeDefined();
      expect(thread?.title).toBe("Thread Title");
      expect(thread?.posts).toHaveLength(2);

      // Check first post
      const firstPost = thread!.posts[0]!;
      expect(firstPost.authorName).toBe("名無し");
      expect(firstPost.mail).toBe("mail");
      expect(firstPost.authorId).toBe("AbcDef1");
      expect(firstPost.content).toContain("&gt;&gt;2");
      expect(firstPost.references).toEqual([2]);

      // Check second post
      const secondPost = thread!.posts[1]!;
      expect(secondPost.authorName).toBe("名無し");
      expect(secondPost.mail).toBe("sage");
      expect(secondPost.authorId).toBe("XyZ234");
      expect(secondPost.replies).toEqual([1]); // Post 1 refers to post 2
    });

    it("should return undefined for empty dat", () => {
      expect(parser.parseThread("", "12345", "http://example.com")).toBeUndefined();
    });

    it("should handle posts with no ID", () => {
      const dat = `名無し<>mail<>2025/09/10(水) 11:05:34.06 <>First post, no ID<>Thread Title`;
      const thread = parser.parseThread(dat, "12345", "http://example.com");
      expect(thread).toBeDefined();
      expect(thread?.posts).toHaveLength(1);
      const firstPost = thread!.posts[0]!;
      expect(firstPost.authorId).toBe("");
    });

    it("should handle 3-digit millisecond dates", () => {
      const dat = `名無し<>mail<>2025/09/10(水) 11:05:34.123 ID:AbcDef1<>Post with 3-digit ms<>Thread Title`;
      const thread = parser.parseThread(dat, "12345");
      expect(thread).toBeDefined();
      expect(thread?.posts).toHaveLength(1);
      const firstPost = thread!.posts[0]!;
      expect(firstPost.date.getMilliseconds()).toBe(123);
    });

    it("should extract image URLs and create simple links", () => {
      const dat = `名無し<>mail<>2025/09/10(水) 11:05:34.06 ID:AbcDef1<>Here is an image: https://example.com/image.jpg and another one http://example.com/image.png<>Thread Title`;
      const thread = parser.parseThread(dat, "12345");
      expect(thread).toBeDefined();
      expect(thread?.posts).toHaveLength(1);
      const firstPost = thread!.posts[0]!;
      expect(firstPost.hasImage).toBe(true);
      expect(firstPost.imageUrls).toEqual([
        "https://example.com/image.jpg",
        "http://example.com/image.png",
      ]);
      expect(firstPost.content).toContain(
        '<a href="https://example.com/image.jpg" target="_blank" rel="noopener noreferrer" class="external-link">https://example.com/image.jpg</a>',
      );
      expect(firstPost.content).toContain(
        '<a href="http://example.com/image.png" target="_blank" rel="noopener noreferrer" class="external-link">http://example.com/image.png</a>',
      );
    });
  });

  describe("parseBBSMenu", () => {
    it("should parse bbsmenu.html correctly", () => {
      const menuHtml = `
<BR><BR><B>Category 1</B><BR>
<A HREF=http://board.example.net/test/read.cgi/cat1/123/>Board 1</A><BR>
<A HREF=http://board.example.net/test/read.cgi/cat1/456/>Board 2</A><BR>
<BR><BR><B>Category &amp; 2</B><BR>
<A HREF=http://board.example.net/test/read.cgi/cat2/789/>Board 3</A><BR>
`;
      const menu = parser.parseBBSMenu(menuHtml);

      expect(menu).toHaveLength(2);

      const firstCategory = menu[0]!;
      expect(firstCategory.name).toBe("Category 1");
      expect(firstCategory.boards).toHaveLength(2);
      expect(firstCategory.boards[0]?.name).toBe("Board 1");
      expect(firstCategory.boards[0]?.url).toBe(
        "http://board.example.net/test/read.cgi/cat1/123/",
      );

      const secondCategory = menu[1]!;
      expect(secondCategory.name).toBe("Category & 2");
      expect(secondCategory.boards).toHaveLength(1);
      expect(secondCategory.boards[0]?.name).toBe("Board 3");
    });

    it("should return an empty array for empty html", () => {
      expect(parser.parseBBSMenu("")).toEqual([]);
    });
  });
});
