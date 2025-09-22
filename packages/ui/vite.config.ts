import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";
import config from "./svelte.config";

export default defineConfig({
    plugins: [svelte(config)],
    build: {
        sourcemap: true,
    },
    css: {
        devSourcemap: true,
    },
});
