// packages/libch/src/core/parser.ts
import { isValid, parse } from "date-fns";
import he from "he";
import type {
    BBSMenu,
    BBSMenuCategory,
    Post,
    SubjectItem,
    OldThread,
} from "./types";
import { invariant, normalizeDateStr } from "./utils";

export interface Parser {
    parseThread(
        dat: string,
        threadId: string,
        url: string
    ): OldThread | undefined;
    parseSubject(subjectTxt: string): SubjectItem[];
    parseBBSMenu(html: string): BBSMenu;
}

export class DefaultParser implements Parser {
    private static readonly talkfm = "yyyy/MM/dd HH:mm:ss.SSS";
    private static readonly fivechfm = "yyyy/MM/dd HH:mm:ss.SS";
    private static readonly oldfm = "yyyy/MM/dd HH:mm:ss";

    private decodeHtmlEntities(str: string): string {
        return he.decode(str);
    }

    private parsePost(
        postStr: string,
        resNum: number
    ): Omit<
        Post,
        | "references"
        | "replies"
        | "hasImage"
        | "hasExternalLink"
        | "postIdCount"
        | "siblingPostNumbers"
        | "imageUrls"
    > | null {
        const trimmedPostStr = postStr.trim();
        if (!trimmedPostStr) return null;

        const splitParts = trimmedPostStr.split("<>");
        const dateAndIdIdx = splitParts.findIndex((str) => str.includes("ID:"));

        if (dateAndIdIdx < 2 || dateAndIdIdx + 1 >= splitParts.length) {
            return null;
        }

        // <b>タグなどを除去
        const authorName = (splitParts[0]?.trim() || "").replace(/<.*?>/g, "");
        const mail = splitParts[1]?.trim() || "";
        const rawContent = splitParts[dateAndIdIdx + 1]?.trim() || "";
        // beリンクなどの不要なaタグを除去
        const content = rawContent
            .replace(/<a\s+href=[^>]*?be\.2ch\.net[^>]*?>.*?<\/a>/i, "")
            .trim();

        const headerPart = splitParts[dateAndIdIdx];

        invariant(headerPart, "failed to parse header");

        const headerSplit = headerPart.split("ID:");
        const rawDateStr = headerSplit[0]?.trim();
        const authorId =
            headerSplit.length > 1
                ? headerSplit.slice(1).join("ID:").trim()
                : "";

        let date: Date;
        if (!rawDateStr) {
            date = new Date();
        } else {
            const dateStr = normalizeDateStr(rawDateStr);
            let parsedDate = parse(dateStr, DefaultParser.talkfm, new Date());
            if (!isValid(parsedDate))
                parsedDate = parse(dateStr, DefaultParser.fivechfm, new Date());
            if (!isValid(parsedDate))
                parsedDate = parse(dateStr, DefaultParser.oldfm, new Date());

            if (!isValid(parsedDate)) {
                throw new Error(
                    `ParseError: Failed to parse date. Raw: "${rawDateStr}", Normalized: "${dateStr}".`
                );
            }
            date = parsedDate;
        }

        return {
            res_num: resNum,
            authorName,
            mail,
            date,
            content,
            authorId,
        };
    }

    public parseThread(
        dat: string,
        threadId: string,
        url: string
    ): OldThread | undefined {
        if (!dat?.trim().length) {
            return undefined;
        }

        const lines = dat.trim().split("\n");
        invariant(!!lines.length && !!lines[0], "No posts found");

        const firstLineParts = lines[0].split("<>");
        const rawTitle =
            firstLineParts.length > 4 ? firstLineParts?.[4]?.trim() : "無題";

        invariant(rawTitle, "failed to parse title");

        const title = this.decodeHtmlEntities(rawTitle);

        const postsToProcess = lines.slice(0, 1000);

        // 1st Pass: 基本的なパースとID集計
        const idPostMap = new Map<string, number[]>();
        const initialPosts: Post[] = postsToProcess
            .map((postStr, index) => {
                try {
                    const post = this.parsePost(postStr, index + 1);
                    if (!post)
                        return {
                            res_num: index + 1,
                            authorName: "",
                            mail: "",
                            date: new Date(),
                            content: postStr,
                            authorId: "",
                            references: [],
                            replies: [],
                            hasImage: false,
                            hasExternalLink: false,
                            postIdCount: 0, // 仮の値
                            siblingPostNumbers: [], // 仮の値
                            imageUrls: [],
                        } as Post;

                    // IDごとのレス番号を記録
                    if (post.authorId) {
                        const resNumber = index + 1;
                        if (!idPostMap.has(post.authorId)) {
                            idPostMap.set(post.authorId, []);
                        }
                        idPostMap.get(post.authorId)!.push(resNumber);
                    }

                    return {
                        ...post,
                        references: [],
                        replies: [],
                        hasImage: false,
                        hasExternalLink: false,
                        postIdCount: 0, // 仮の値
                        siblingPostNumbers: [], // 仮の値
                        imageUrls: [],
                    };
                } catch (err) {
                    console.error(
                        "投稿のパースに失敗しました:",
                        err,
                        "投稿文字列:",
                        postStr
                    );
                    return null;
                }
            })
            .filter((p): p is Post => p !== null);

        // 2nd Pass: 参照関係の構築とHTML変換、ID情報の付与
        initialPosts.forEach((post, index) => {
            const resNumber = index + 1;

            // ID情報の付与
            if (post.authorId) {
                const siblingPosts = idPostMap.get(post.authorId) || [];
                post.postIdCount = siblingPosts.length;
                post.siblingPostNumbers = siblingPosts;
            }

            const decodedContent = this.decodeHtmlEntities(post.content);
            const anchorRegex = />>(\d+)/g;
            let match;

            while ((match = anchorRegex.exec(decodedContent)) !== null) {
                const strNum = match[1];
                if (!strNum) {
                    console.warn("invalid match object", match);
                    continue;
                }
                const targetResNumber = parseInt(strNum, 10);
                const targetIndex = targetResNumber - 1;

                if (targetIndex >= 0 && targetIndex < initialPosts.length) {
                    const targetPost = initialPosts[targetIndex]!;
                    if (!post.references.includes(targetResNumber)) {
                        post.references.push(targetResNumber);
                    }
                    if (!targetPost.replies.includes(resNumber)) {
                        targetPost.replies.push(resNumber);
                    }
                }
            }

            // --- コンテンツ変換ロジック ---
            const contentParts = decodedContent.split(
                /(>>\d+|<br>|https?:\/\/[^\s<>"']+)/
            );
            const imageUrls: string[] = [];

            const processedContent = contentParts
                .map((part) => {
                    if (!part) return ""; // 空文字列はスキップ

                    // アンカー (>>1)
                    if (part.startsWith(">>")) {
                        const resNum = part.substring(2);
                        const escapedPart = part.replace(/>/g, "&gt;");
                        return `<a class="internal-res-link" data-thread-id="${threadId}" data-res-number="${resNum}">${escapedPart}</a>`;
                    }

                    // URL (http... or https...)
                    if (part.startsWith("http")) {
                        const url = part;
                        // 画像URLの場合は、imageUrls 配列に追加
                        if (/\.(jpg|jpeg|png|gif)$/i.test(url)) {
                            post.hasImage = true;
                            if (!imageUrls.includes(url)) {
                                imageUrls.push(url);
                            }
                        }
                        // すべてのURLをリンクとして扱う
                        post.hasExternalLink = true;
                        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="external-link">${url}</a>`;
                    }

                    // 改行タグ
                    if (part === "<br>") {
                        return "<br />";
                    }

                    // それ以外のテキスト
                    return part;
                })
                .join("");

            post.content = processedContent;
            post.imageUrls = imageUrls;
        });

        return {
            id: threadId,
            title,
            posts: initialPosts,
            url,
        };
    }

    public parseSubject(subjectTxt: string): SubjectItem[] {
        if (!subjectTxt?.trim()) {
            return [];
        }

        const lines = subjectTxt.trim().split(/\r?\n/);
        const items: SubjectItem[] = [];

        for (const line of lines) {
            const match = line.match(/^(\d{10})\.dat<>(.+?)\s+\((\d{1,4})\)$/);

            if (match) {
                const [, id, title, resCountStr] = match;
                const resCount = parseInt(resCountStr!, 10);

                if (id && title && !isNaN(resCount)) {
                    items.push({
                        id,
                        title: this.decodeHtmlEntities(title.trim()),
                        resCount,
                    });
                }
            }
        }

        return items;
    }

    public parseBBSMenu(html: string): BBSMenu {
        const lines = html.split(/\r?\n/);
        const menu: BBSMenu = [];
        let currentCategory: BBSMenuCategory | null = null;

        const categoryRegex = /<BR><BR><B>(.*?)<\/B><BR>/i;
        const boardRegex = /<A HREF=(.*?)>(.*?)<\/A>/i;

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            const categoryMatch = trimmedLine.match(categoryRegex);
            if (categoryMatch && categoryMatch[1]) {
                currentCategory = {
                    name: this.decodeHtmlEntities(categoryMatch[1].trim()),
                    boards: [],
                };
                menu.push(currentCategory);
                continue;
            }

            if (currentCategory) {
                const boardMatch = trimmedLine.match(boardRegex);
                if (boardMatch && boardMatch[1] && boardMatch[2]) {
                    const url = boardMatch[1].trim().replace(/^"|"$/g, ""); // クォートを除去
                    const name = this.decodeHtmlEntities(boardMatch[2].trim());

                    // 不要なリンクを除外
                    if (
                        url &&
                        name &&
                        !url.includes("index.html") &&
                        !url.endsWith("../") &&
                        !name.toLowerCase().includes("top")
                    ) {
                        currentCategory.boards.push({ name, url });
                    }
                }
            }
        }

        return menu.filter((category) => category.boards.length > 0);
    }
}
