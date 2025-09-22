import { runBuild } from "@nobit/esbuild-config/base";
import config from "./svelte.config.js";
import svelte from "esbuild-svelte";

await runBuild({
    entryPoints: [
        "./src/stores/**/*.*",
        "./src/utils/**/*.*",
        "./src/view/**/*.*",
    ],
    outdir: "./dist",
    mode: "production",
    override: {
        alias: {
            "@tabler/icons-svelte": "@tabler-icons/dist/esm/index.mjs",
        },
        plugins: [
            svelte({
                preprocess: config.preprocess,
            }),
        ],
    },
});
