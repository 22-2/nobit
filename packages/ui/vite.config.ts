import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [
        svelte({
            preprocess: vitePreprocess(),
        }),
    ],
    build: {
        sourcemap: true,
    },
    css: {
        devSourcemap: true,
    },
});
