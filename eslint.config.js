// ESLint v9+ config for Guardon project
/** @type {import('eslint').Linter.FlatConfig} */
export default [
  {
    files: ["**/*.{js,cjs,mjs,jsx,ts,tsx}", "!node_modules/**"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        module: "writable",
        require: "readonly"
      }
    },
    linterOptions: {
      reportUnusedDisableDirectives: true
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "error",
      "no-console": "warn",
      eqeqeq: "error",
      curly: "error",
      semi: ["error", "always"],
      quotes: ["error", "double"]
    }
  }
];
