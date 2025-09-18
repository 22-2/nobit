export interface ParsedBbsUrl {
  host: string;
  board: string;
  threadId?: string;
  // This allows the object to be compatible with Obsidian's ViewState,
  // which expects a string index signature.
  [key: string]: unknown;
}

export function parseBbsUrl(url: string): ParsedBbsUrl | null {
  // Ensure the URL has a scheme for consistent parsing.
  const fullUrl = url.includes("://") ? url : `https://${url}`;

  // 1. スレッドURL形式の試行 (e.g., https://bbs.eddibb.cc/test/read.cgi/livejupiter/1678886400/)
  // This regex now handles optional trailing segments like post numbers (e.g. /14)
  const threadUrlRegex =
    /https?:\/\/([^/]+)\/test\/read\.cgi\/([^/]+)\/(\d+)(?:\/\d*)?\/?$/;
  const threadMatch = fullUrl.match(threadUrlRegex);
  if (threadMatch) {
    const [, host, board, threadId] = threadMatch;
    if (host && board && threadId) {
      return { host, board, threadId };
    }
  }

  // 2. 板URL形式の試行 (e.g., bbs.eddibb.cc/liveedge, https://bbs.eddibb.cc/liveedge)
  try {
    const urlObj = new URL(fullUrl);
    const host = urlObj.hostname;
    // パスを/で分割し、空の要素を除外
    const pathSegments = urlObj.pathname.split("/").filter(Boolean);

    // "bbsmenu" がパスに含まれている場合は、BBSのURLとはみなさない
    if (pathSegments.includes("bbsmenu")) {
      return null;
    }

    // "test" や "read.cgi" のような特殊なパスセグメントをフィルタリング
    const boardSegments = pathSegments.filter(
      (seg) => seg !== "test" && seg !== "read.cgi",
    );

    // スレッドIDと見られる数字の羅列も除外
    const finalBoardSegments = boardSegments.filter(
      (seg) => !/^\d{10,}$/.test(seg),
    );

    if (host && finalBoardSegments.length > 0) {
      // 最初の意味のあるパスセグメントを板名として解釈
      return { host, board: finalBoardSegments[0]! };
    }
  } catch (e) {
    // URLのパースに失敗した場合は何もしない
  }

  return null;
}
