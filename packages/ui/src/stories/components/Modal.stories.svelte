<script module>
    import { defineMeta } from "@storybook/addon-svelte-csf";
    import { expect, userEvent, within, waitFor } from "storybook/test";
    import Modal from "../../components/Modal.svelte";
    import Button from "../../components/Button.svelte";
    import {
        testFocusTrap,
        testKeyboardNavigation,
        testAccessibilityAttributes,
    } from "../../test-utils/interaction-helpers";

    const { Story } = defineMeta({
        title: "Components/Modal",
        component: Modal,
        tags: ["autodocs", "test"],
        argTypes: {
            open: {
                control: "boolean",
            },
            title: {
                control: "text",
            },
            size: {
                control: { type: "select" },
                options: ["sm", "md", "lg", "xl"],
            },
            closable: {
                control: "boolean",
            },
        },
    });
</script>

<script>
    let { args } = $props();
    let isOpen = $state(false);
    let actionResult = $state("");

    function openModal() {
        isOpen = true;
    }

    function closeModal() {
        isOpen = false;
    }

    function handleAction(action: string) {
        actionResult = action;
        closeModal();
    }
</script>

<!-- 基本的なモーダルのテスト -->
<Story
    name="BasicModal"
    args={{
        title: "基本的なモーダル",
        size: "md",
        closable: true,
    }}
    play={async ({ canvasElement, step }) => {
        const canvas = within(canvasElement);

        await step("Should open modal when button is clicked", async () => {
            const openButton = await canvas.findByTestId("open-modal-button");
            await userEvent.click(openButton);

            const dialog = await canvas.findByTestId("modal-dialog");
            expect(dialog).toHaveAttribute("open");

            const title = await canvas.findByTestId("modal-title");
            expect(title).toHaveTextContent("基本的なモーダル");
        });

        await step(
            "Should close modal when close button is clicked",
            async () => {
                const closeButton =
                    await canvas.findByTestId("modal-close-button");
                await userEvent.click(closeButton);

                await waitFor(() => {
                    const dialog = canvas.queryByTestId("modal-dialog");
                    expect(dialog).not.toHaveAttribute("open");
                });
            }
        );
    }}
>
    <div>
        <Button onclick={openModal} data-testid="open-modal-button"
            >モーダルを開く</Button
        >
        <Modal {...args} open={isOpen} onclose={closeModal}>
            <p>これは基本的なモーダルの内容です。</p>
            <div class="mt-4 flex justify-end space-x-2">
                <Button variant="secondary" onclick={closeModal}
                    >キャンセル</Button
                >
                <Button onclick={() => handleAction("confirmed")}>確認</Button>
            </div>
        </Modal>
    </div>
</Story>

<!-- フォーカストラップのテスト -->
<Story
    name="FocusTrap"
    args={{
        title: "フォーカストラップテスト",
        size: "md",
        closable: true,
    }}
    play={async ({ canvasElement, step }) => {
        const canvas = within(canvasElement);

        await step("Should open modal", async () => {
            const openButton = await canvas.findByTestId("open-modal-button");
            await userEvent.click(openButton);

            const dialog = await canvas.findByTestId("modal-dialog");
            expect(dialog).toHaveAttribute("open");
        });

        await step("Should trap focus within modal", async () => {
            // フォーカストラップのテスト
            const focusableSelectors = [
                '[data-testid="modal-close-button"]',
                '[data-testid="input-field"]',
                '[data-testid="cancel-button"]',
                '[data-testid="submit-button"]',
            ];

            // 最初の要素（閉じるボタン）にフォーカスが当たることを確認
            const closeButton = await canvas.findByTestId("modal-close-button");
            expect(closeButton).toHaveFocus();

            // Tabキーでフォーカスが順番に移動することを確認
            await userEvent.keyboard("{Tab}");
            const inputField = await canvas.findByTestId("input-field");
            expect(inputField).toHaveFocus();

            await userEvent.keyboard("{Tab}");
            const cancelButton = await canvas.findByTestId("cancel-button");
            expect(cancelButton).toHaveFocus();

            await userEvent.keyboard("{Tab}");
            const submitButton = await canvas.findByTestId("submit-button");
            expect(submitButton).toHaveFocus();

            // 最後の要素からTabで最初に戻ることを確認
            await userEvent.keyboard("{Tab}");
            expect(closeButton).toHaveFocus();
        });

        await step("Should close modal with Escape key", async () => {
            await userEvent.keyboard("{Escape}");

            await waitFor(() => {
                const dialog = canvas.queryByTestId("modal-dialog");
                expect(dialog).not.toHaveAttribute("open");
            });
        });
    }}
>
    <div>
        <Button onclick={openModal} data-testid="open-modal-button"
            >フォーカステスト</Button
        >
        <Modal {...args} open={isOpen} onclose={closeModal}>
            <div class="space-y-4">
                <div>
                    <label
                        for="test-input"
                        class="block text-sm font-medium text-gray-700"
                    >
                        テスト入力
                    </label>
                    <input
                        id="test-input"
                        type="text"
                        class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        data-testid="input-field"
                    />
                </div>
                <div class="flex justify-end space-x-2">
                    <Button
                        variant="secondary"
                        onclick={closeModal}
                        data-testid="cancel-button"
                    >
                        キャンセル
                    </Button>
                    <Button
                        onclick={() => handleAction("submitted")}
                        data-testid="submit-button"
                    >
                        送信
                    </Button>
                </div>
            </div>
        </Modal>
    </div>
</Story>

<!-- サイズバリエーションのテスト -->
<Story
    name="Sizes"
    play={async ({ canvasElement, step }) => {
        const canvas = within(canvasElement);

        await step("Should render different sizes correctly", async () => {
            // 小サイズ
            const smallButton = await canvas.findByTestId("open-small");
            await userEvent.click(smallButton);

            let modalContent = await canvas.findByTestId("modal-content");
            expect(modalContent).toHaveClass("max-w-md");

            let closeButton = await canvas.findByTestId("modal-close-button");
            await userEvent.click(closeButton);

            // 大サイズ
            const largeButton = await canvas.findByTestId("open-large");
            await userEvent.click(largeButton);

            modalContent = await canvas.findByTestId("modal-content");
            expect(modalContent).toHaveClass("max-w-2xl");
        });
    }}
>
    <div class="space-x-4">
        <Button
            onclick={() => {
                isOpen = true;
            }}
            data-testid="open-small"
        >
            小サイズ
        </Button>
        <Button
            onclick={() => {
                isOpen = true;
            }}
            data-testid="open-large"
        >
            大サイズ
        </Button>

        <Modal
            title="小サイズモーダル"
            size="sm"
            open={isOpen}
            onclose={closeModal}
        >
            <p>小サイズのモーダルです。</p>
        </Modal>
    </div>
</Story>

<!-- 閉じられないモーダルのテスト -->
<Story
    name="NonClosable"
    args={{
        title: "閉じられないモーダル",
        closable: false,
    }}
    play={async ({ canvasElement, step }) => {
        const canvas = within(canvasElement);

        await step("Should open non-closable modal", async () => {
            const openButton = await canvas.findByTestId("open-modal-button");
            await userEvent.click(openButton);

            const dialog = await canvas.findByTestId("modal-dialog");
            expect(dialog).toHaveAttribute("open");

            // 閉じるボタンが表示されていないことを確認
            const closeButton = canvas.queryByTestId("modal-close-button");
            expect(closeButton).not.toBeInTheDocument();
        });

        await step("Should not close with Escape key", async () => {
            await userEvent.keyboard("{Escape}");

            // モーダルが開いたままであることを確認
            const dialog = await canvas.findByTestId("modal-dialog");
            expect(dialog).toHaveAttribute("open");
        });

        await step("Should close only with explicit action", async () => {
            const actionButton = await canvas.findByTestId("action-button");
            await userEvent.click(actionButton);

            await waitFor(() => {
                const dialog = canvas.queryByTestId("modal-dialog");
                expect(dialog).not.toHaveAttribute("open");
            });
        });
    }}
>
    <div>
        <Button onclick={openModal} data-testid="open-modal-button">
            閉じられないモーダル
        </Button>
        <Modal {...args} open={isOpen} onclose={closeModal}>
            <p>このモーダルは明示的なアクションでのみ閉じることができます。</p>
            <div class="mt-4 flex justify-end">
                <Button
                    onclick={() => handleAction("forced-close")}
                    data-testid="action-button"
                >
                    アクション実行
                </Button>
            </div>
        </Modal>
        {#if actionResult}
            <p data-testid="action-result" class="mt-2 text-sm text-gray-600">
                実行されたアクション: {actionResult}
            </p>
        {/if}
    </div>
</Story>

<!-- アクセシビリティのテスト -->
<Story
    name="Accessibility"
    args={{
        title: "アクセシビリティテスト",
        size: "md",
        closable: true,
    }}
    play={async ({ canvasElement, step }) => {
        const canvas = within(canvasElement);

        await step("Should have correct accessibility attributes", async () => {
            const openButton = await canvas.findByTestId("open-modal-button");
            await userEvent.click(openButton);

            const modalContent = await canvas.findByTestId("modal-content");

            // アクセシビリティ属性のテスト
            testAccessibilityAttributes(modalContent, {
                role: "dialog",
                "aria-modal": "true",
                "aria-labelledby": "modal-title",
            });

            const title = await canvas.findByTestId("modal-title");
            expect(title).toHaveAttribute("id", "modal-title");

            const closeButton = await canvas.findByTestId("modal-close-button");
            expect(closeButton).toHaveAttribute(
                "aria-label",
                "モーダルを閉じる"
            );
        });
    }}
>
    <div>
        <Button onclick={openModal} data-testid="open-modal-button">
            アクセシビリティテスト
        </Button>
        <Modal {...args} open={isOpen} onclose={closeModal}>
            <p>アクセシビリティ機能をテストするモーダルです。</p>
        </Modal>
    </div>
</Story>
