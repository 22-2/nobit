import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [svelte(config)],
    build: {
        sourcemap: true,
    },
    css: {
        devSourcemap: true,
    },
});
