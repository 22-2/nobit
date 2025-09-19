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
