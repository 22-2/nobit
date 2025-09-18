import { sveltePreprocess } from "svelte-preprocess";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://svelte.dev/docs#compile-time-svelte-preprocess
  // for more information about preprocessors
  preprocess: sveltePreprocess({
    css: "injected",
    warningFilter: (warning) => !warning.code.startsWith("a11y"), // a11y-から始まる警告をすべて無視
  }),
};

export default config;
