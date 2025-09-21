import { defineConfig } from "vitest/config";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const __filename = fileURLToPath(import.meta.url);

console.log(__filename);

export default defineConfig({
    test: {
        projects: ["./vitest.config.unit.ts", "./vitest.config.storybook.ts"],
        reporters: [
            "verbose",
            ["junit", { outputFile: "test-results/unit-junit.xml" }],
            ["json", { outputFile: "test-results/unit-report.json" }],
        ],
    },
});
