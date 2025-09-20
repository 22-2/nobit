import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineProject } from 'vitest/config'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import config from './svelte.config.js'
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";

const dirname =
    typeof __dirname !== "undefined"
        ? __dirname
        : path.dirname(fileURLToPath(import.meta.url));

export default defineProject({
    plugins: [
        storybookTest({
            configDir: path.join(dirname, ".storybook"),
        }),
        svelte(config),
    ],
    test: {
        name: "storybook",
        browser: {
            enabled: true,
            headless: true,
            provider: "playwright",
            instances: [{ browser: "chromium" }],
        },
        setupFiles: [".storybook/vitest.setup.ts"],
    },
})
