import { App, SuggestModal, type Instruction } from "obsidian";

export class SelectionDialog<T extends string[]> extends SuggestModal<
	T[number]
> {
	selected: T[number] | null = null;
	inputValue: string = "";
	cancelled: boolean = false;

	constructor(
		app: App,
		public title: string,
		public items: T,
		public placeholder?: string,
		public defaultValue?: T[number],
		public instructions?: Instruction[],
	) {
		super(app);
		this.inputEl.setAttribute("placeholder", this.placeholder || "");

		// インストラクションを設定
		if (this.instructions && this.instructions.length > 0) {
			this.setInstructions(this.instructions);
		}

		// 入力値を追跡
		this.inputEl.addEventListener("input", () => {
			this.inputValue = this.inputEl.value;
		});

		// Escapeキーハンドラーを登録
		this.scope.register([], "Escape", () => {
			this.cancelled = true;
			this.close();
			return false;
		});
	}

	getSuggestions(query: string): T {
		if (!query.trim().length) {
			return this.items;
		}

		const lq = query.toLowerCase();
		return this.items
			.map((item) => {
				const score = microFuzzy(item.toLowerCase(), lq).score;
				return { item, score };
			})
			.filter(({ score }) => score > 0)
			.sort((a, b) => b.score - a.score)
			.map(({ item }) => item) as T;
	}

	renderSuggestion(item: T[number], el: HTMLElement): void {
		el.appendChild(
			createDiv({
				text: item,
			}),
		);
	}

	onChooseSuggestion(item: T[number]) {
		this.selected = item;
	}

	/**
	 * ダイアログを開き、Promiseを返却します。
	 *   - 候補が選択されたらPromiseをresolve(T)します
	 *   - 入力値がある場合はPromiseをresolve(入力値)します
	 *   - それ以外の方法でダイアログを閉じたらPromiseをresolve(null)します
	 */
	open(): Promise<T[number] | null> {
		super.open();

		return new Promise<T[number] | null>((resolve) => {
			this.onClose = async () => {
				await sleep(0); // onChooseItemを先に発動させるため
				super.onClose();
				// If cancelled with Escape, return null
				if (this.cancelled) {
					resolve(null);
				} else {
					// If no item was selected but there's input value, use it
					if (!this.selected && this.inputValue.trim()) {
						resolve(this.inputValue as T[number]);
					} else {
						resolve(this.selected);
					}
				}
			};
		});
	}
}

/**
 * 選択肢ダイアログを表示し、選択された値を返却します。
 * キャンセル時はnullを返却します。
 *
 * @example
 * ```ts
 * await showSelectionDialog({
 *   app: this.app,
 *   message: "ファイルを選択",
 *   items: ["file1.md", "file2.md"],
 *   placeholder: "ファイル名を入力または選択",
 *   instructions: [
 *     { command: "[↑↓]", purpose: "移動" },
 *     { command: "[↵]", purpose: "選択" },
 *     { command: "[ESC]", purpose: "キャンセル" }
 *   ]
 * });
 * ```
 */
export async function showSelectionDialog<T extends string[]>(args: {
	app: App;
	message: string;
	items: T;
	placeholder?: string;
	defaultValue?: T[number];
	instructions?: Instruction[];
}): Promise<T[number] | null> {
	return new SelectionDialog(
		args.app,
		args.message,
		args.items,
		args.placeholder,
		args.defaultValue,
		args.instructions,
	).open();
}

export type FuzzyResult =
	| { type: "starts-with"; score: number }
	| { type: "includes"; score: number }
	| { type: "fuzzy"; score: number }
	| { type: "none"; score: number };

/**
 * 最小限のファジーマッチを行います
 */
export function microFuzzy(value: string, query: string): FuzzyResult {
	if (value.startsWith(query)) {
		return { type: "starts-with", score: 2 ** query.length / value.length };
	}
	const emojiLessValue = excludeEmoji(value);
	if (emojiLessValue.startsWith(query)) {
		return { type: "starts-with", score: 2 ** query.length / value.length };
	}

	if (value.includes(query)) {
		return { type: "includes", score: 2 ** query.length / value.length };
	}

	let i = 0;
	let scoreSeed = 0;
	let combo = 0;
	for (let j = 0; j < emojiLessValue.length; j++) {
		if (emojiLessValue[j] === query[i]) {
			combo++;
			i++;
		} else {
			if (combo > 0) {
				scoreSeed += 2 ** combo;
				combo = 0;
			}
		}
		if (i === query.length) {
			if (combo > 0) {
				scoreSeed += 2 ** combo;
			}
			return { type: "fuzzy", score: scoreSeed / value.length };
		}
	}

	return { type: "none", score: 0 };
}

/**
 * 絵文字を除外します
 */
export function excludeEmoji(text: string): string {
	return text.replace(regEmoji, "");
}

const regEmoji = new RegExp(
	// biome-ignore lint/suspicious/noMisleadingCharacterClass: <explanation>
	/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]|[\uFE0E-\uFE0F]/,
	"g",
);
