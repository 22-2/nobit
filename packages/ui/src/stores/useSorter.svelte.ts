import { type ColumnKey } from "../types";

export type SortDirection = "asc" | "desc";

/** ソーターの状態 */
export type SorterState = {
    sortKey: ColumnKey | null;
    sortDirection: SortDirection;
};

/**
 * ソート可能なカラムの設定
 * @template T - ソート対象のアイテムの型
 */
export type SortColumn<T> = {
    /** 昇順でソートするための比較関数 */
    compare: (a: T, b: T) => number;
    /** このキーが選択されたときのデフォルトのソート方向 */
    defaultDirection?: SortDirection;
};

/**
 * useSorterに渡すカラム設定の型
 * @template T - ソート対象のアイテムの型
 */
export type SorterColumns<T> = {
    [key: string]: SortColumn<T>;
};

/**
 * Svelte 5 runes を利用して、配列のソート状態を管理するコンポーザブル関数。
 *
 * @template T - ソート対象のアイテムの型
 * @param getItems - ソート対象のアイテム配列を返すリアクティブな関数 (例: `() => threads`)
 * @param columns - 各カラムのソートロジックを定義したオブジェクト
 * @param initialState - ソーターの初期状態
 * @param onSortChange - ソート状態が変更されたときに呼び出されるコールバック
 * @returns リアクティブなソート状態と、ソートを更新する関数
 */
export function useSorter<T>(
    getItems: () => T[],
    columns: SorterColumns<T>,
    initialState: SorterState,
    onSortChange: (newState: SorterState) => void
) {
    let sortKey = $state(initialState.sortKey);
    let sortDirection = $state(initialState.sortDirection);

    /**
     * 指定されたキーでソートを実行します。
     * 1. 新しいキーの場合: 昇順 (またはデフォルト順) でソート
     * 2. 同じキーで1回目クリック: 降順に切り替え
     * 3. 同じキーで2回目クリック: ソートを解除
     * @param newKey - ソートするキー
     */
    function setSort(newKey: string) {
        const defaultDirection = columns[newKey]?.defaultDirection ?? "asc";

        if (sortKey === newKey) {
            // Same key, cycle through states
            if (sortDirection === defaultDirection) {
                // From default to opposite
                sortDirection = defaultDirection === "asc" ? "desc" : "asc";
            } else {
                // From opposite to reset
                sortKey = null;
            }
        } else {
            // New key, start at default
            sortKey = newKey;
            sortDirection = defaultDirection;
        }

        // Notify callback
        onSortChange({ sortKey: sortKey, sortDirection: sortDirection });
    }

    const sortedItems = $derived(() => {
        const currentKey = sortKey;
        const sourceItems = getItems();

        // ソートキーが指定されていない、または設定が存在しない場合は元の配列を返す
        if (!currentKey || !columns[currentKey]) {
            return sourceItems;
        }

        // パフォーマンスのため、元の配列を破壊しないようにコピーを作成
        const sorted = [...sourceItems];
        const { compare } = columns[currentKey]!;

        sorted.sort((a, b) => {
            const result = compare(a, b);
            // ソート方向に応じて結果を調整
            return sortDirection === "asc" ? result : -result;
        });

        return sorted;
    });

    return {
        /** 現在のソートキー (リアクティブ) */
        get sortKey() {
            return sortKey;
        },
        /** 現在のソート方向 (リアクティブ) */
        get sortDirection() {
            return sortDirection;
        },
        /** ソート済みのアイテム配列 (リアクティブ) */
        get sortedItems() {
            return sortedItems;
        },
        /** ソートを実行する関数 */
        setSort,
    };
}
