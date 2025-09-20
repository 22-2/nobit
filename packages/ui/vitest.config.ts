import path from "node:path";
import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import config from "./svelte.config.js";
import { defineConfig } from "vitest/config";

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";

const dirname =
    typeof __dirname !== "undefined"
        ? __dirname
        : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
    test: {
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html", "lcov"],
            reportsDirectory: "./coverage",
            exclude: [
                "node_modules/**",
                "dist/**",
                "storybook-static/**",
                "**/*.config.{js,ts}",
                "**/*.stories.{js,ts,svelte}",
            ],
        },
        projects: [
            // Unit tests project
            {
                name: "unit",
                test: {
                    include: ["src/**/*.{test,spec}.{js,ts,svelte}"],
                    exclude: ["src/**/*.stories.{js,ts,svelte}"],
                    environment: "jsdom",
                    globals: true,
                    setupFiles: ["./vitest.setup.ts"],
                },
                plugins: [svelte(config)],
            },
        ],
    },
});
