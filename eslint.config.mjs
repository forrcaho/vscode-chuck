import typescriptEslint from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";

export default [{
    files: [ "**/*.ts"],
    plugins: {
        "@typescript-eslint": typescriptEslint,
    },

    languageOptions: {
        globals: {
            ...globals.node,
        },

        parser: tsParser,
        ecmaVersion: 5,
        sourceType: "module",

        parserOptions: {
            project: "tsconfig.json",
        },
    },

    rules: {
        "@typescript-eslint/naming-convention": "warn",
        "@typescript-eslint/no-unused-expressions": "warn",
        curly: "warn",
        eqeqeq: ["warn", "always"],
        "no-redeclare": "warn",
        "no-throw-literal": "warn",
        "no-unused-expressions": "off",
        semi: "off",
    },
}];
