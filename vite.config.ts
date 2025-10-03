import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import config from "./svelte.config.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
	plugins: [svelte(config)],
	build: {
		sourcemap: true,
	},
	css: {
		devSourcemap: true,
	},
	resolve: {
		alias: {
			src: path.resolve(__dirname, "src"),
		},
	},
});
