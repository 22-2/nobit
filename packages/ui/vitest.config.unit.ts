import { defineProject } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import config from "./svelte.config.js";
import { svelteTesting } from "@testing-library/svelte/vite";

export default defineProject({
    test: {
        name: "unit",
        include: ["src/**/*.{test,spec}.{js,ts,svelte}"],
        exclude: ["src/**/*.stories.{js,ts,svelte}"],
        environment: "jsdom",
        globals: true,
        setupFiles: ["./vitest.setup.ts"],
    },
    plugins: [svelte(config), svelteTesting()],
});
