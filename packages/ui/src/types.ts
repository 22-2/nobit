export interface VisibleColumns {
    [key: string]: boolean;
    index: boolean;
    title: boolean;
    resCount: boolean;
    ikioi: boolean;
}

export type ColumnKey = keyof VisibleColumns;

export interface SubjectItem {
    id: string; // スレッドID (unixtime)
    title: string;
    resCount: number;
}

export interface Board {
    name: string;
    url: string;
}

export interface BBSMenuCategory {
    name: string;
    boards: Board[];
}

export type BBSMenu = BBSMenuCategory[];

export interface Post {
    resNum: number;

    authorName: string;
    mail: string;
    authorId: string;
    /**
     * パーサーによってアンカー(>>1)が<a>タグに変換済みのHTML文字列。
     * コンポーネント側ではこれをそのまま {@html} で表示します。
     */
    content: string;
    date: Date;
    /** このレスが参照しているレス番号の配列 (例: [10, 25]) */
    references: number[];
    /** このレスから返信されている（被参照）レス番号の配列 (例: [100, 123]) */
    replies: number[];
    hasImage: boolean;
    hasExternalLink: boolean;
    /** この投稿のIDがスレッド内で書き込んだ総数 */
    postIdCount: number;
    /** この投稿のIDが書き込んだレス番号の配列（自分自身も含む） */
    siblingPostNumbers: number[];
    /** この投稿に含まれる画像のURLの配列 */
    imageUrls?: string[];
}

export interface Thread {
    title: string;
    posts: Post[];
    url: string;
    id: string;
    resCount: number;
}
