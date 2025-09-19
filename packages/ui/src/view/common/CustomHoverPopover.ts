import { mount, unmount } from "svelte";
import { Logger } from "../../utils/logging";

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
            component.onunload();
        }
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
    private level: number;
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

        Logger.debug(
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
        Logger.debug(
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
            this.popoverService.hidePopoversFrom(this.level + 1);
        });

        this.registerDomEvent(this.hoverEl, "mouseleave", () => {
            this.popoverService.startHideTimer();
        });

        this.registerDomEvent(this.hoverEl, "click", (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest("a, button")) {
                this.popoverService.hidePopoversFrom(this.level + 1);
            }
        });
    }

    override onunload() {
        super.onunload();
        this.domEventListeners.forEach(({ el, type, listener }) => {
            el.removeEventListener(type, listener);
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
