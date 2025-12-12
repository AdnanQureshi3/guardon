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
        require: "readonly",
        chrome: "readonly",
        fetch: "readonly",
        URL: "readonly",
        FileReader: "readonly",
        Blob: "readonly",
        navigator: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        alert: "readonly",
        location: "readonly",
        form: "readonly",
        showToast: "readonly",
        editRule: "readonly",
        deleteRule: "readonly",
        openAPIPreviewBtn: "readonly",
        pi: "readonly",
        __dirname: "readonly",
        exports: "writable",
        define: "readonly",
        self: "readonly",
        describe: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeAll: "readonly",
        beforeEach: "readonly",
        afterAll: "readonly",
        afterEach: "readonly",
        global: "readonly"
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
  },
  {
    ignores: [
      "src/lib/js-yaml.min.js",
      "dist/**"
    ]
  }
];
