import js from "@eslint/js";
import globals from "globals";
import pluginVue from "eslint-plugin-vue";
import markdown from "@eslint/markdown";
import css from "@eslint/css";
import { defineConfig } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier";

export default defineConfig([
    {
        files: ["**/*.{js,mjs,cjs,vue}"],
        plugins: { js }, extends: ["js/recommended"],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node
            }
        }
    },
    pluginVue.configs["flat/essential"],
    {
        files: ["**/*.md"],
        plugins: { markdown },
        language: "markdown/gfm",
        extends: ["markdown/recommended"]
    },
    {
        files: ["**/*.css"],
        plugins: { css },
        language: "css/css",
        extends: ["css/recommended"]
    },

    // Disables rules that conflict with Prettier
    eslintConfigPrettier,
]);
