import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    svelte(), // ここに svelte プラグインが正しく設定されているか確認っす
  ],
});
