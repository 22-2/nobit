<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";

    interface Props {
        open?: boolean;
        title?: string;
        size?: "sm" | "md" | "lg" | "xl";
        closable?: boolean;
        children?: any;
        class?: string;
    }

    let {
        open = false,
        title = "",
        size = "md",
        closable = true,
        children,
        class: className = "",
    }: Props = $props();

    const dispatch = createEventDispatcher<{
        close: void;
        open: void;
    }>();

    let dialogElement: HTMLDialogElement;
    let previousActiveElement: HTMLElement | null = null;

    const sizeClasses = {
        sm: "max-w-md",
        md: "max-w-lg",
        lg: "max-w-2xl",
        xl: "max-w-4xl",
    };

    // フォーカストラップ用の要素を取得
    function getFocusableElements(container: HTMLElement): HTMLElement[] {
        const focusableSelectors = [
            "button:not([disabled])",
            "input:not([disabled])",
            "select:not([disabled])",
            "textarea:not([disabled])",
            "a[href]",
            '[tabindex]:not([tabindex="-1"])',
        ];

        return Array.from(
            container.querySelectorAll(focusableSelectors.join(", "))
        ) as HTMLElement[];
    }

    function handleKeydown(event: KeyboardEvent) {
        if (!open) return;

        if (event.key === "Escape" && closable) {
            handleClose();
            return;
        }

        if (event.key === "Tab") {
            const focusableElements = getFocusableElements(dialogElement);
            if (focusableElements.length === 0) return;

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (event.shiftKey) {
                if (document.activeElement === firstElement) {
                    event.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    event.preventDefault();
                    firstElement.focus();
                }
            }
        }
    }

    function handleClose() {
        if (!closable) return;
        dispatch("close");
    }

    function handleBackdropClick(event: MouseEvent) {
        if (event.target === event.currentTarget && closable) {
            handleClose();
        }
    }

    $effect(() => {
        if (open) {
            previousActiveElement = document.activeElement as HTMLElement;
            dialogElement?.showModal();
            dispatch("open");

            // 最初のフォーカス可能な要素にフォーカス
            const focusableElements = getFocusableElements(dialogElement);
            if (focusableElements.length > 0) {
                focusableElements[0].focus();
            }
        } else {
            dialogElement?.close();
            previousActiveElement?.focus();
        }
    });

    onMount(() => {
        return () => {
            previousActiveElement?.focus();
        };
    });
</script>

<svelte:window on:keydown={handleKeydown} />

<dialog
    bind:this={dialogElement}
    class="backdrop:bg-black backdrop:bg-opacity-50 bg-transparent p-0 max-w-none max-h-none"
    data-testid="modal-dialog"
    on:click={handleBackdropClick}
>
    <div class="fixed inset-0 flex items-center justify-center p-4">
        <div
            class="bg-white rounded-lg shadow-xl {sizeClasses[
                size
            ]} w-full {className}"
            data-testid="modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
        >
            {#if title || closable}
                <div
                    class="flex items-center justify-between p-6 border-b border-gray-200"
                >
                    {#if title}
                        <h2
                            id="modal-title"
                            class="text-lg font-semibold text-gray-900"
                            data-testid="modal-title"
                        >
                            {title}
                        </h2>
                    {/if}

                    {#if closable}
                        <button
                            type="button"
                            class="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1"
                            data-testid="modal-close-button"
                            onclick={handleClose}
                            aria-label="モーダルを閉じる"
                        >
                            <svg
                                class="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    {/if}
                </div>
            {/if}

            <div class="p-6" data-testid="modal-body">
                {@render children?.()}
            </div>
        </div>
    </div>
</dialog>
