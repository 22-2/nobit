import { defineProject } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import config from "./svelte.config.js";
import { svelteTesting } from "@testing-library/svelte/vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    resolve: {
        alias: {
            // @tabler/icons-svelte へのインポートを空のモジュールに置き換える
            "@tabler/icons-svelte": path.resolve(
                __dirname,
                "src/__mocks__/empty.js"
            ),
        },
    },
});
