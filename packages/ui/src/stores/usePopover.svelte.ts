import { mount, unmount } from "svelte";
import PostItemComponent from "../view/thread/PostItem.svelte";
import PostTree from "../view/thread/PostTree.svelte";
import InfoPopup from "../view/common/InfoPopup.svelte";
import {
    CustomHoverPopover,
    Component,
    type PopoverService as IPopoverService,
} from "../view/common/CustomHoverPopover";
import type { Post, Thread } from "../types";
import log from "loglevel";

export interface UsePopoverReturn {
    handleHover: (
        targetEl: HTMLElement,
        postIndex: number,
        level: number,
        event: MouseEvent
    ) => void;
    handleShowReplyTree: (
        targetEl: HTMLElement,
        originResNumber: number,
        level: number,
        event: MouseEvent
    ) => void;
    startHideTimer: () => void;
    setThreadData: (data: Thread | null) => void;
    init: (container: HTMLElement) => void;
    destroy: () => void;
    activePopovers: CustomHoverPopover[];
}

export function usePopover(): UsePopoverReturn {
    // --- State Management ---
    const activePopovers = $state<CustomHoverPopover[]>([]);
    let hideTimeout: NodeJS.Timeout | null = null;
    let threadData: Thread | null = null;
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
        if (activePopovers.length <= fromLevel) return;

        log.debug(`[PopoverService] Hiding popovers from level ${fromLevel}.`);

        const toClose = activePopovers.slice(fromLevel);
        const remainingPopovers = activePopovers.slice(0, fromLevel);

        activePopovers.length = 0;
        activePopovers.push(...remainingPopovers);

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
        const isClickInsidePopover = activePopovers.some((popover) =>
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
            log.error(
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

        const newPopovers = activePopovers.slice(0, level);
        newPopovers.push(popover);
        activePopovers.length = 0;
        activePopovers.push(...newPopovers);
    }

    function showPostTreePreview(
        targetEl: HTMLElement,
        post: Post,
        level: number,
        event: MouseEvent
    ) {
        if (!popoverContainer || !threadData) {
            log.error(
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
                    thread: threadData!,
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

        const newPopovers = activePopovers.slice(0, level);
        newPopovers.push(popover);
        activePopovers.length = 0;
        activePopovers.push(...newPopovers);
    }

    function showSimplePopup(message: string, event: MouseEvent) {
        if (!popoverContainer) {
            log.error(
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

        if (activePopovers[level]?.targetEl === targetEl) {
            return;
        }

        hidePopoversFrom(level);
        showPostPreview(targetEl, post, postIndex, level, event);
    }

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

    // --- Public API ---
    return {
        handleHover,
        handleShowReplyTree,
        startHideTimer,
        setThreadData(data: Thread | null) {
            threadData = data;
        },
        init(container: HTMLElement) {
            popoverContainer = container;
            document.addEventListener("mousedown", handleDocumentClick);
        },
        destroy() {
            hidePopoversFrom(0);
            threadData = null;
            popoverContainer = null;
            document.removeEventListener("mousedown", handleDocumentClick);
        },
        get activePopovers() {
            return activePopovers;
        },
    };
}

//
/**
 * 後方互換性のためのレガシーエクスポート（必要に応じて削除可能）
 * @deprecated
 *  */
export const popoverService = usePopover();
export type PopoverService = ReturnType<typeof usePopover>;
