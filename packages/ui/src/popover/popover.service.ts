import { writable, get } from "svelte/store";
import { mount, unmount } from "svelte";
import type { Post, OldThread } from "@repo/libch/core/types";
import PostItemComponent from "../components/PostItem.svelte";
import PostTree from "../components/PostTree.svelte";
import InfoPopup from "../components/InfoPopup.svelte";
import {
    CustomHoverPopover,
    Component,
    type PopoverService as IPopoverService,
} from "./CustomHoverPopover";
import { Logger } from "../utils/logging";

// --- State Management ---

export const activePopovers = writable<CustomHoverPopover[]>([]);

let hideTimeout: NodeJS.Timeout | null = null;
let threadData: OldThread | null = null;
let popoverContainer: HTMLElement | null = null;

const popoverRoot = new Component();

// --- Private Functions ---

function clearHideTimer() {
    if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
    }
}

function hidePopoversFrom(fromLevel: number) {
    const currentPopovers = get(activePopovers);
    if (currentPopovers.length <= fromLevel) return;

    Logger.debug(`[PopoverService] Hiding popovers from level ${fromLevel}.`);

    const toClose = currentPopovers.slice(fromLevel);
    const remainingPopovers = currentPopovers.slice(0, fromLevel);

    activePopovers.set(remainingPopovers);

    toClose.forEach((popover) => popover.hide());
}

function startHideTimer() {
    clearHideTimer();
    hideTimeout = setTimeout(() => {
        hidePopoversFrom(0);
    }, 300);
}

function handleDocumentClick(event: MouseEvent) {
    const target = event.target as Node;
    const isClickInsidePopover = get(activePopovers).some((popover) =>
        popover.hoverEl.contains(target)
    );

    if (!isClickInsidePopover) {
        hidePopoversFrom(0);
    }
}

const serviceInterface: IPopoverService = {
    clearHideTimer,
    hidePopoversFrom,
    startHideTimer,
    register: (popover) => popoverRoot.addChild(popover),
    unregister: (popover) => popoverRoot.removeChild(popover),
};

function showPostPreview(
    targetEl: HTMLElement,
    post: Post,
    index: number,
    level: number,
    event: MouseEvent
) {
    if (!popoverContainer) {
        Logger.error(
            "[PopoverService] Popover container is not set. Call init() first."
        );
        return;
    }

    const popover = new CustomHoverPopover(
        serviceInterface,
        popoverContainer,
        targetEl,
        level,
        event
    );

    popover.show((target) =>
        mount(PostItemComponent, {
            target,
            props: {
                post,
                index,
                onHoverPostLink: (detail: {
                    targetEl: HTMLElement;
                    index: number;
                    event: MouseEvent;
                }) =>
                    handleHover(
                        detail.targetEl,
                        detail.index,
                        level + 1,
                        detail.event
                    ),
                onShowReplyTree: (detail: {
                    targetEl: HTMLElement;
                    originResNumber: number;
                    event: MouseEvent;
                }) => {
                    handleShowReplyTree(
                        detail.targetEl,
                        detail.originResNumber,
                        level, // Pass the current level
                        detail.event
                    );
                },
            },
        })
    );

    activePopovers.update((popovers) => {
        const newPopovers = popovers.slice(0, level);
        newPopovers.push(popover);
        return newPopovers;
    });
}

function showPostTreePreview(
    targetEl: HTMLElement,
    post: Post,
    level: number,
    event: MouseEvent
) {
    if (!popoverContainer || !threadData) {
        Logger.error(
            "[PopoverService] Popover container or thread data is not set. Call init() and setThreadData() first."
        );
        return;
    }

    const popover = new CustomHoverPopover(
        serviceInterface,
        popoverContainer,
        targetEl,
        level,
        event
    );

    popover.show((target) =>
        mount(PostTree, {
            target,
            props: {
                post,
                thread: threadData,
                onHoverPostLink: (detail: {
                    targetEl: HTMLElement;
                    index: number;
                    event: MouseEvent;
                }) => {
                    handleHover(
                        detail.targetEl,
                        detail.index,
                        level + 1,
                        detail.event
                    );
                },
                onShowReplyTree: (detail: {
                    targetEl: HTMLElement;
                    originResNumber: number;
                    event: MouseEvent;
                }) => {
                    // Popovers within popovers should be at a higher level
                    // But for now, let's just re-use the main handler.
                    // This will replace the current popover, which is acceptable.
                    handleShowReplyTree(
                        detail.targetEl,
                        detail.originResNumber,
                        level,
                        detail.event
                    );
                },
            },
        })
    );

    activePopovers.update((popovers) => {
        const newPopovers = popovers.slice(0, level);
        newPopovers.push(popover);
        return newPopovers;
    });
}

function showSimplePopup(message: string, event: MouseEvent) {
    if (!popoverContainer) {
        Logger.error(
            "[PopoverService] Popover container is not set. Call init() first."
        );
        return;
    }

    const popupEl = document.createElement("div");
    popoverContainer.appendChild(popupEl);

    const svelteComponent = mount(InfoPopup, {
        target: popupEl,
        props: {
            message,
        },
    });

    // Position the popup
    const parentRect = popoverContainer.getBoundingClientRect();
    let top = event.clientY - parentRect.top;
    let left = event.clientX - parentRect.left + 10;

    popupEl.style.position = "absolute";
    popupEl.style.top = `${top}px`;
    popupEl.style.left = `${left}px`;

    // Automatically hide after a few seconds
    setTimeout(() => {
        unmount(svelteComponent);
        popupEl.remove();
    }, 2000);
}

function handleHover(
    targetEl: HTMLElement,
    postIndex: number,
    level: number,
    event: MouseEvent
) {
    clearHideTimer();
    const post = threadData?.posts[postIndex];
    if (!post) {
        showSimplePopup("該当レス無し", event);
        return;
    }

    const currentPopovers = get(activePopovers);
    if (currentPopovers[level]?.targetEl === targetEl) {
        return;
    }

    hidePopoversFrom(level);
    showPostPreview(targetEl, post, postIndex, level, event);
}

// --- Public API ---

function handleShowReplyTree(
    targetEl: HTMLElement,
    originResNumber: number,
    level: number,
    event: MouseEvent
) {
    clearHideTimer();
    const postIndex = originResNumber - 1;
    const post = threadData?.posts[postIndex];
    if (!post) {
        showSimplePopup("該当レス無し", event);
        return;
    }

    // Preserve the parent popover by hiding only the levels above the current one.
    hidePopoversFrom(level + 1);
    showPostTreePreview(targetEl, post, level + 1, event);
}

export const popoverService = {
    init(container: HTMLElement) {
        popoverContainer = container;
        document.addEventListener("mousedown", handleDocumentClick);
    },
    setThreadData(data: OldThread | null) {
        threadData = data;
    },
    handleHover,
    handleShowReplyTree,
    startHideTimer,
    destroy() {
        hidePopoversFrom(0);
        threadData = null;
        popoverContainer = null;
        document.removeEventListener("mousedown", handleDocumentClick);
    },
};

export type PopoverService = typeof popoverService;
