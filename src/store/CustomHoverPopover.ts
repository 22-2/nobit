import log from "loglevel";
import { mount, unmount } from "svelte";

// A minimal Component class to replicate Obsidian's lifecycle management
// without the dependency on Obsidian itself.
export class Component {
    private children: Component[] = [];
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public onload() {}
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public onunload() {}

    addChild(component: Component) {
        this.children.push(component);
        component.onload();
    }

    removeChild(component: Component) {
        const index = this.children.indexOf(component);
        if (index > -1) {
            this.children.splice(index, 1);
            component.unload();
        }
    }

    unload() {
        // Unload all children first
        this.children.forEach(child => child.unload());
        this.children = [];
        // Then call onunload hook
        this.onunload();
    }
}

// Interface for the popover service that will manage the popovers
export interface PopoverService {
    clearHideTimer(): void;
    hidePopoversFrom(level: number): void;
    startHideTimer(): void;
    register(popover: CustomHoverPopover): void;
    unregister(popover: CustomHoverPopover): void;
}

/**
 * 独自のホバーポップアップクラス。
 * ObsidianのComponentを継承する代わりに、自己完結型のComponentを使用する。
 */
export class CustomHoverPopover extends Component {
    private popoverService: PopoverService;
    private parentContainer: HTMLElement;
    public targetEl: HTMLElement;
    public level: number;
    private initialEvent: MouseEvent;

    public hoverEl: HTMLElement;
    private svelteComponent: ReturnType<typeof mount> | null = null;
    private isShown = false;
    private domEventListeners: {
        el: HTMLElement;
        type: keyof HTMLElementEventMap;
        listener: (ev: unknown) => unknown;
    }[] = [];

    constructor(
        popoverService: PopoverService,
        parentContainer: HTMLElement,
        targetEl: HTMLElement,
        level: number,
        initialEvent: MouseEvent
    ) {
        super();
        this.popoverService = popoverService;
        this.parentContainer = parentContainer;
        this.targetEl = targetEl;
        this.level = level;
        this.initialEvent = initialEvent;

        this.hoverEl = document.createElement("div");
        this.hoverEl.classList.add(
            "popover",
            "hover-popover",
            "bbs-post-preview"
        );
    }

    show(mountFn: (target: HTMLElement) => ReturnType<typeof mount>) {
        if (this.isShown) return;
        this.isShown = true;

        log.debug(
            `[CustomHoverPopover] show() called for level ${this.level}.`
        );

        this.popoverService.register(this);
        this.svelteComponent = mountFn(this.hoverEl);
    }

    hide() {
        if (!this.isShown) return;
        this.isShown = false;
        this.popoverService.unregister(this);
    }

    override onload() {
        super.onload();
        log.debug(
            `[CustomHoverPopover] onload() called. Appending hoverEl to parentContainer.`,
            {
                hoverEl: this.hoverEl,
                parentContainer: this.parentContainer,
            }
        );

        this.parentContainer.appendChild(this.hoverEl);
        this.position();

        this.registerDomEvent(this.hoverEl, "mouseenter", () => {
            this.popoverService.clearHideTimer();
            // このポップアップより後のポップアップを閉じる
            // activePopovers配列内のインデックスはlevelと同じなので、level+1から閉じる
            this.popoverService.hidePopoversFrom(this.level + 1);
        });

        this.registerDomEvent(this.hoverEl, "mouseleave", () => {
            this.popoverService.startHideTimer();
        });

        // カスタムイベントをリッスン（PostItemから発火される）
        const contentClickListener = (event: Event) => {
            log.debug(`[CustomHoverPopover] Popover content click on level ${this.level}`, event);
            console.log(`[CustomHoverPopover] Popover content click on level ${this.level}`);
            // 子ポップアップを閉じる（levelではなく、配列のインデックスを渡す）
            // activePopovers配列内でこのポップアップの次のインデックスから閉じる
            this.popoverService.hidePopoversFrom(this.level);
        };
        this.hoverEl.addEventListener("popover-content-click", contentClickListener);
        console.log(`[CustomHoverPopover] Registered popover-content-click listener on level ${this.level}`);
        this.domEventListeners.push({
            el: this.hoverEl,
            type: "popover-content-click" as keyof HTMLElementEventMap,
            listener: contentClickListener as (ev: unknown) => unknown
        });

        // キャプチャフェーズでクリックイベントを捕捉
        this.hoverEl.addEventListener("click", (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            log.debug(`[CustomHoverPopover] Click event on level ${this.level}, target:`, target);

            // リンクやボタンをクリックした場合は、その要素の処理を優先
            if (target.closest("a, button")) {
                log.debug(`[CustomHoverPopover] Click on link/button, ignoring`);
                return;
            }
            // それ以外の場所をクリックした場合は、子ポップアップを閉じる
            log.debug(`[CustomHoverPopover] Hiding popovers from level ${this.level}`);
            this.popoverService.hidePopoversFrom(this.level);
        }, true); // キャプチャフェーズで実行
    }

    override onunload() {
        super.onunload();
        this.domEventListeners.forEach(({ el, type, listener }) => {
            el.removeEventListener(type, listener);
            // キャプチャフェーズのリスナーも削除
            el.removeEventListener(type, listener, true);
        });
        this.domEventListeners = [];

        if (this.svelteComponent) {
            unmount(this.svelteComponent);
            this.svelteComponent = null;
        }
        this.hoverEl.remove();
    }

    registerDomEvent<K extends keyof HTMLElementEventMap>(
        el: HTMLElement,
        type: K,
        listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => unknown
    ) {
        // Cast listener to a generic function to store it
        const genericListener = listener as (ev: unknown) => unknown;
        this.domEventListeners.push({ el, type, listener: genericListener });
        el.addEventListener(type, genericListener);
    }

    private position() {
        this.hoverEl.style.position = "absolute";
        this.hoverEl.style.visibility = "hidden";

        requestAnimationFrame(() => {
            if (!this.parentContainer.isConnected) {
                // If parent is detached, we can't calculate position.
                return;
            }
            const parentRect = this.parentContainer.getBoundingClientRect();
            this.hoverEl.style.visibility = "visible";
            const popoverRect = this.hoverEl.getBoundingClientRect();
            this.hoverEl.style.visibility = "hidden";

            let top =
                this.initialEvent.clientY -
                parentRect.top +
                this.parentContainer.scrollTop;
            let left =
                this.initialEvent.clientX -
                parentRect.left +
                10 +
                this.parentContainer.scrollLeft;

            if (
                this.initialEvent.clientX -
                    parentRect.left +
                    popoverRect.width >
                this.parentContainer.clientWidth
            ) {
                left =
                    this.initialEvent.clientX -
                    parentRect.left -
                    popoverRect.width -
                    5 +
                    this.parentContainer.scrollLeft;
            }
            if (
                this.initialEvent.clientY -
                    parentRect.top +
                    popoverRect.height >
                this.parentContainer.clientHeight
            ) {
                top =
                    this.initialEvent.clientY -
                    parentRect.top -
                    popoverRect.height +
                    this.parentContainer.scrollTop;
            }

            top = Math.max(this.parentContainer.scrollTop + 5, top);
            left = Math.max(this.parentContainer.scrollLeft + 5, left);

            this.hoverEl.style.top = `${top}px`;
            this.hoverEl.style.left = `${left}px`;
            this.hoverEl.style.visibility = "visible";
        });
    }
}
