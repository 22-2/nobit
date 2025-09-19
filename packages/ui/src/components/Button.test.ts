import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import Button from "./Button.svelte";

describe("Button Component", () => {
    it("renders with default props", () => {
        render(Button, { children: () => "Test Button" });

        const button = screen.getByTestId("button");
        expect(button).toBeInTheDocument();
        expect(button).toHaveTextContent("Test Button");
        expect(button).toHaveClass("bg-blue-600"); // primary variant
    });

    it("applies correct variant classes", () => {
        const { rerender } = render(Button, {
            variant: "secondary",
            children: () => "Secondary",
        });

        let button = screen.getByTestId("button");
        expect(button).toHaveClass("bg-gray-200");

        rerender({ variant: "danger", children: () => "Danger" });
        button = screen.getByTestId("button");
        expect(button).toHaveClass("bg-red-600");
    });

    it("applies correct size classes", () => {
        const { rerender } = render(Button, {
            size: "sm",
            children: () => "Small",
        });

        let button = screen.getByTestId("button");
        expect(button).toHaveClass("px-3", "py-1.5", "text-sm");

        rerender({ size: "lg", children: () => "Large" });
        button = screen.getByTestId("button");
        expect(button).toHaveClass("px-6", "py-3", "text-lg");
    });

    it("handles click events", async () => {
        const handleClick = vi.fn();
        render(Button, {
            onclick: handleClick,
            children: () => "Clickable",
        });

        const button = screen.getByTestId("button");
        await fireEvent.click(button);

        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("is disabled when loading", () => {
        render(Button, {
            loading: true,
            children: () => "Loading",
        });

        const button = screen.getByTestId("button");
        expect(button).toBeDisabled();

        // ローディングスピナーが表示されることを確認
        const spinner = button.querySelector("svg.animate-spin");
        expect(spinner).toBeInTheDocument();
    });

    it("is disabled when disabled prop is true", () => {
        render(Button, {
            disabled: true,
            children: () => "Disabled",
        });

        const button = screen.getByTestId("button");
        expect(button).toBeDisabled();
    });

    it("does not call onclick when disabled", async () => {
        const handleClick = vi.fn();
        render(Button, {
            disabled: true,
            onclick: handleClick,
            children: () => "Disabled",
        });

        const button = screen.getByTestId("button");
        await fireEvent.click(button);

        expect(handleClick).not.toHaveBeenCalled();
    });

    it("applies custom className", () => {
        render(Button, {
            class: "custom-class",
            children: () => "Custom",
        });

        const button = screen.getByTestId("button");
        expect(button).toHaveClass("custom-class");
    });

    it("passes through additional props", () => {
        render(Button, {
            id: "custom-id",
            "aria-label": "Custom label",
            children: () => "Props",
        });

        const button = screen.getByTestId("button");
        expect(button).toHaveAttribute("id", "custom-id");
        expect(button).toHaveAttribute("aria-label", "Custom label");
    });
});
