import type { StorybookConfig } from "@storybook/svelte-vite";

import { join, dirname } from "path";

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
    return dirname(require.resolve(join(value, "package.json")));
}
const config: StorybookConfig = {
    stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|ts|svelte)"],
    addons: [
        {
            name: getAbsolutePath("@storybook/addon-svelte-csf"),
            options: {
                legacyTemplate: true,
            },
        },
        getAbsolutePath("@chromatic-com/storybook"),
        getAbsolutePath("@storybook/addon-docs"),
        getAbsolutePath("@storybook/addon-a11y"),
        getAbsolutePath("@storybook/addon-vitest"),
    ],
    framework: {
        name: getAbsolutePath("@storybook/svelte-vite"),
        options: {},
    },
    async viteFinal(config) {
        // ソースマップを有効にする
        config.build = config.build || {};
        config.build.sourcemap = true;

        config.css = config.css || {};
        config.css.devSourcemap = true;

        return config;
    },
};
export default config;
