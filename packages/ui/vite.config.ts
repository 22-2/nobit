import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";
import { glob } from "glob";

async function getEntryPoints(pattarns: string[] | string): Promise<string[]> {
    if (Array.isArray(pattarns)) {
        const results = await Promise.all(
            pattarns.map((pat) => getEntryPoints(pat))
        );
        return results.flat();
    } else {
        return glob(pattarns);
    }
}

const entry = await getEntryPoints([
    "./src/stores/**/*.*",
    "./src/utils/**/*.*",
    "./src/view/**/*.*",
]);

console.log(entry);

export default defineConfig({
    plugins: [
        svelte({
            preprocess: vitePreprocess(),
        }),
    ],
    build: {
        lib: {
            entry: entry.filter((e) => !e.endsWith(".css")),
        },
        sourcemap: true,
    },
    css: {
        devSourcemap: true,
    },
});
