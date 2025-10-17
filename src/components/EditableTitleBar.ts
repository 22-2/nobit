import log from "loglevel";
import { type ItemView } from "obsidian";
import type NobitPlugin from "../main";

const Logger = log.getLogger("TitleUrlEditor");

// TitleUrlEditorが操作するビューが持つべきメソッドを定義するインターフェース
export interface EditableItemView extends ItemView {
	navigateToThreadFromUrl(url: string): Promise<void>;
	getURL(): string;
	getDisplayText(): string;
}

export class EditableTitleBar {
	private view: EditableItemView;
	private plugin: NobitPlugin;
	private titleEl: HTMLElement;
	private titleContainerEl: HTMLElement;

	constructor(view: EditableItemView, plugin: NobitPlugin) {
		this.view = view;
		this.plugin = plugin;
		this.titleEl = view.titleEl;
		this.titleContainerEl = view.titleContainerEl;
	}

	public setup() {
		if (
			!(this.titleEl instanceof HTMLElement) ||
			!(this.titleContainerEl instanceof HTMLElement)
		) {
			Logger.warn("Title elements not found for TitleUrlEditor.");
			return;
		}

		this.titleEl.contentEditable = "true";
		this.titleEl.style.cursor = "text";

		this.view.registerDomEvent(this.titleContainerEl, "click", (evt) => {
			if (evt.target !== this.titleEl) {
				this.titleEl.focus();
			}
		});

		this.view.registerDomEvent(
			this.titleEl,
			"focus",
			this.handleFocus.bind(this),
		);
		this.view.registerDomEvent(
			this.titleEl,
			"keydown",
			this.handleKeyDown.bind(this),
		);
		this.view.registerDomEvent(
			this.titleEl,
			"blur",
			this.handleBlur.bind(this),
		);
	}

	private handleFocus(evt: FocusEvent) {
		const target = evt.target as HTMLElement;
		window.setTimeout(() => {
			const selection = window.getSelection();
			if (!selection) return;
			const range = document.createRange();
			range.selectNodeContents(target);
			selection.removeAllRanges();
			selection.addRange(range);
		}, 0);
	}

	private async handleKeyDown(evt: KeyboardEvent) {
		if (evt.key === "Enter") {
			evt.preventDefault();
			await this.view.navigateToThreadFromUrl(
				this.titleEl.innerText.trim(),
			);
			this.titleEl.blur();
		}
	}

	private handleBlur() {
		// Restore the display text (could be title or URL)
		const displayText = this.view.getDisplayText();
		this.titleEl.innerText = displayText;
	}

	public setText(text: string) {
		this.titleEl.innerText = text;
	}
}
