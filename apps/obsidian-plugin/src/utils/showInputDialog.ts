import { App, Modal } from "obsidian";

/**
 * 入力ダイアログを表示し、入力された値を返却します。
 * キャンセル時はnullを返却します。(入力なしで決定した場合は空文字)
 *
 * ```ts
 * await showInputDialog({ message: "名前を入力してください" })
 * // "入力した名前"
 * ```
 */
export async function showInputDialog(
    app: App,
    args: {
        message: string;
        placeholder?: string;
        defaultValue?: string;
    }
): Promise<string | null> {
    return new InputDialog(
        app,
        args.message,
        args.placeholder,
        args.defaultValue
    ).open();
}

export class InputDialog extends Modal {
    inputEl!: HTMLInputElement;
    promise!: Promise<string | null>;
    submitted = false;

    constructor(
        app: App,
        public title: string,
        public placeholder?: string,
        public defaultValue?: string
    ) {
        super(app);
    }

    onOpen(): void {
        this.titleEl.setText(this.title);

        this.inputEl = this.contentEl.createEl("input", {
            type: "text",
            placeholder: this.placeholder ?? "",
            cls: "carnelian-input-dialog-input",
            value: this.defaultValue,
        });
    }

    /**
     * ダイアログを開き、Promiseを返却します。
     *   - Enterが押されたらPromiseをresolve(入力文字列)します
     *     - 入力がない場合は空文字
     *   - それ以外の方法でダイアログを閉じたらPromiseをresolve(null)します
     */
    open(): Promise<string | null> {
        super.open();

        this.promise = new Promise<string | null>((resolve) => {
            const listener = (ev: KeyboardEvent) => {
                if (ev.isComposing) {
                    return;
                }
                if (ev.code === "Enter") {
                    ev.preventDefault();
                    resolve(this.inputEl.value);
                    this.submitted = true;
                    this.close();
                }
            };

            this.inputEl.addEventListener("keydown", listener);

            // クローズ時にsubmitされていないときはPromiseをnullで解決させ、Listnerも解除
            this.onClose = () => {
                super.onClose();
                this.inputEl.removeEventListener("keydown", listener);
                if (!this.submitted) {
                    resolve(null);
                }
            };
        });

        return this.promise;
    }
}
