<script module>
    import { defineMeta } from "@storybook/addon-svelte-csf";
    import { expect, userEvent, within, waitFor } from "storybook/test";
    import Button from "../../components/Button.svelte";

    const { Story } = defineMeta({
        title: "Components/Button",
        component: Button,
        tags: ["autodocs", "test"],
        argTypes: {
            variant: {
                control: { type: "select" },
                options: ["primary", "secondary", "danger"],
            },
            size: {
                control: { type: "select" },
                options: ["sm", "md", "lg"],
            },
            loading: {
                control: "boolean",
            },
            disabled: {
                control: "boolean",
            },
        },
    });
</script>

<script>
    let { args } = $props();
    let clickCount = $state(0);

    function handleClick() {
        clickCount++;
    }
</script>

<!-- 基本的なボタンのテスト -->
<Story
    name="Primary"
    args={{
        variant: "primary",
        size: "md",
    }}
    play={async ({ canvasElement, step }) => {
        const canvas = within(canvasElement);

        await step("Should render button with correct text", async () => {
            const button = await canvas.findByTestId("button");
            expect(button).toBeInTheDocument();
            expect(button).toHaveTextContent("Primary Button");
        });

        await step("Should be clickable", async () => {
            const button = await canvas.findByTestId("button");
            await userEvent.click(button);
            // クリックイベントが発火することを確認
            expect(button).toHaveAttribute("data-testid", "button");
        });
    }}
>
    <Button {...args} onclick={handleClick}>Primary Button</Button>
</Story>

<!-- ローディング状態のテスト -->
<Story
    name="Loading"
    args={{
        variant: "primary",
        loading: true,
    }}
    play={async ({ canvasElement, step }) => {
        const canvas = within(canvasElement);

        await step("Should show loading spinner", async () => {
            const button = await canvas.findByTestId("button");
            expect(button).toBeDisabled();

            // ローディングスピナーが表示されることを確認
            const spinner = button.querySelector("svg.animate-spin");
            expect(spinner).toBeInTheDocument();
        });

        await step("Should not be clickable when loading", async () => {
            const button = await canvas.findByTestId("button");
            expect(button).toBeDisabled();
        });
    }}
>
    <Button {...args}>Loading Button</Button>
</Story>

<!-- 無効状態のテスト -->
<Story
    name="Disabled"
    args={{
        variant: "secondary",
        disabled: true,
    }}
    play={async ({ canvasElement, step }) => {
        const canvas = within(canvasElement);

        await step("Should be disabled", async () => {
            const button = await canvas.findByTestId("button");
            expect(button).toBeDisabled();
        });

        await step("Should not respond to clicks", async () => {
            const button = await canvas.findByTestId("button");
            await userEvent.click(button);
            // 無効なボタンはクリックイベントが発火しない
            expect(button).toBeDisabled();
        });
    }}
>
    <Button {...args}>Disabled Button</Button>
</Story>

<!-- 危険なアクションのテスト -->
<Story
    name="Danger"
    args={{
        variant: "danger",
        size: "lg",
    }}
    play={async ({ canvasElement, step }) => {
        const canvas = within(canvasElement);

        await step("Should have danger styling", async () => {
            const button = await canvas.findByTestId("button");
            expect(button).toHaveClass("bg-red-600");
        });

        await step("Should handle click events", async () => {
            const button = await canvas.findByTestId("button");
            await userEvent.click(button);
            expect(button).toBeInTheDocument();
        });
    }}
>
    <Button {...args}>Delete</Button>
</Story>

<!-- サイズバリエーションのテスト -->
<Story
    name="Sizes"
    play={async ({ canvasElement, step }) => {
        const canvas = within(canvasElement);

        await step("Should render all size variants", async () => {
            const smallButton = await canvas.findByText("Small");
            const mediumButton = await canvas.findByText("Medium");
            const largeButton = await canvas.findByText("Large");

            expect(smallButton).toHaveClass("px-3", "py-1.5", "text-sm");
            expect(mediumButton).toHaveClass("px-4", "py-2", "text-base");
            expect(largeButton).toHaveClass("px-6", "py-3", "text-lg");
        });
    }}
>
    <div class="space-x-4">
        <Button variant="primary" size="sm">Small</Button>
        <Button variant="primary" size="md">Medium</Button>
        <Button variant="primary" size="lg">Large</Button>
    </div>
</Story>

<!-- インタラクションの複合テスト -->
<Story
    name="InteractionTest"
    args={{
        variant: "primary",
    }}
    play={async ({ canvasElement, step }) => {
        const canvas = within(canvasElement);

        await step("Should handle multiple clicks", async () => {
            const button = await canvas.findByTestId("button");
            const counter = await canvas.findByTestId("click-counter");

            expect(counter).toHaveTextContent("Clicks: 0");

            await userEvent.click(button);
            await waitFor(() => {
                expect(counter).toHaveTextContent("Clicks: 1");
            });

            await userEvent.click(button);
            await waitFor(() => {
                expect(counter).toHaveTextContent("Clicks: 2");
            });
        });

        await step("Should handle keyboard navigation", async () => {
            const button = await canvas.findByTestId("button");

            // フォーカスを当てる
            button.focus();
            expect(button).toHaveFocus();

            // Enterキーでクリック
            await userEvent.keyboard("{Enter}");

            const counter = await canvas.findByTestId("click-counter");
            await waitFor(() => {
                expect(counter).toHaveTextContent("Clicks: 3");
            });
        });
    }}
>
    <div>
        <Button {...args} onclick={handleClick}>Click Me</Button>
        <p data-testid="click-counter">Clicks: {clickCount}</p>
    </div>
</Story>
